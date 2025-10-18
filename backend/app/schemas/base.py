from pydantic import BaseModel


class OrmBaseModel(BaseModel):
    class Config:
        from_attributes = True
