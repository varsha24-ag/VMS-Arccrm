from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=3, description="Email or phone")
    password: str = Field(..., min_length=8)


class UserOut(BaseModel):
    id: int
    name: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
