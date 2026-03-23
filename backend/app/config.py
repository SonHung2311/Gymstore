from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql://gymuser:gympass@localhost:5432/gymstore"
    secret_key: str = "supersecretkey_change_in_production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
