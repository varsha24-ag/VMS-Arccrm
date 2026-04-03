require('dotenv').config({ path: '../.env' });
const axios = require('axios'), { Sequelize, DataTypes, Op } = require('sequelize'), cron = require('node-cron'), nodemailer = require('nodemailer');

const LOCK_ID = 54321, BATCH = 1000, RETRIES = 3, DELAY = 2000;
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  resource_id: { type: DataTypes.INTEGER, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  phone: { type: DataTypes.STRING, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING },
  project: { type: DataTypes.STRING },
  project_lead: { type: DataTypes.STRING },
  shift: { type: DataTypes.STRING },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'employees', timestamps: false });

async function notify(status, info) {
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  const isErr = status === 'FAILURE';
  await transporter.sendMail({
    from: `"VMS Sync" <${process.env.SMTP_FROM}>`, to: 'varsha.nagda@arcgate.com',
    subject: `${status}: Employee Sync - ${new Date().toLocaleString()}`,
    text: isErr ? `FAILURE: ${info.message}\n\n${info.stack}` : `SUCCESS REPORT\nAPI: ${info.totalFetched}\nNew: ${info.inserted}\nRe-active: ${info.reactivated}\nDeactive: ${info.deactivated}`
  }).catch(e => console.error('Email failed:', e.message));
}

async function fetch() {
  for (let i = 1; i <= RETRIES; i++) {
    try {
      const { data } = await axios.post(process.env.EMPLOYEE_API_URL, { ResourceID: 0, EmpUniqueID: "", IsCurrentEmployee: 1 }, { headers: { AppID: process.env.EMPLOYEE_APP_ID, 'Content-Type': 'application/json' }, timeout: 45000 });
      if (!Array.isArray(data)) throw new Error('Invalid API response');
      return data;
    } catch (e) { if (i === RETRIES) throw e; await new Promise(r => setTimeout(r, DELAY)); }
  }
}

async function runSync() {
  console.log(`[${new Date().toISOString()}] Sync Started.`);
  const stats = { totalFetched: 0, inserted: 0, deactivated: 0, reactivated: 0, skipped: 0 };
  let lock = false;

  try {
    const [[{ success }]] = await sequelize.query(`SELECT pg_try_advisory_lock(${LOCK_ID}) as success`);
    if (!success) return console.warn('Sync already running.');
    lock = true;

    const apiData = await fetch();
    stats.totalFetched = apiData.length;

    await sequelize.transaction(async (t) => {
      const now = new Date(), apiIDs = new Set(apiData.map(e => e.ResourceID).filter(id => id !== null));
      const db = await Employee.findAll({ attributes: ['resource_id', 'is_active'], raw: true, transaction: t });
      const dbMap = new Map(db.map(e => [e.resource_id, e.is_active]));

      const deact = db.filter(e => e.resource_id && !apiIDs.has(e.resource_id) && e.is_active !== false).map(e => e.resource_id);
      for (let i = 0; i < deact.length; i += BATCH) await Employee.update({ is_active: false, updated_at: now }, { where: { resource_id: { [Op.in]: deact.slice(i, i + BATCH) } }, transaction: t });
      stats.deactivated = deact.length;

      const react = db.filter(e => e.resource_id && apiIDs.has(e.resource_id) && e.is_active === false).map(e => e.resource_id);
      for (let i = 0; i < react.length; i += BATCH) await Employee.update({ is_active: true, updated_at: now }, { where: { resource_id: { [Op.in]: react.slice(i, i + BATCH) } }, transaction: t });
      stats.reactivated = react.length;

      const hires = apiData.filter(e => !dbMap.has(e.ResourceID)).map(e => ({
        resource_id: e.ResourceID, name: e.Name || e.EmployeeName || 'Unknown', email: e.Email || null, phone: e.Phone_M || e.Phone || null,
        password_hash: '$2b$12$K.Y2DqfRzPj8A0V0X6t7UeW/zVvA1rJ/16H5z8I8d6E6x6f6f6f6f', role: 'employee',
        department: e.Department || 'General', project: e.Project || null, project_lead: e.ProjectLead || null, shift: e.Shift || null,
        is_active: true, created_at: now, updated_at: now
      }));
      for (let i = 0; i < hires.length; i += BATCH) await Employee.bulkCreate(hires.slice(i, i + BATCH), { transaction: t, validate: true, ignoreDuplicates: true });
      stats.inserted = hires.length;
      stats.skipped = apiData.length - hires.length;
    });

    console.log(`[Success] API: ${stats.totalFetched} | New: ${stats.inserted}`);
    await notify('SUCCESS', stats);
  } catch (e) { console.error('Sync error:', e.message); await notify('FAILURE', e); }
  finally { if (lock) await sequelize.query(`SELECT pg_advisory_unlock(${LOCK_ID})`); console.log('Job Finished.'); }
}

cron.schedule('30 10 * * *', runSync);
if (require.main === module) runSync();
module.exports = { runSync };
