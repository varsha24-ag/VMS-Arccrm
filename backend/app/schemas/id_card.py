from pydantic import BaseModel


class IdCardOut(BaseModel):
    id: int
    id_number: str
    status: str
