@echo off
echo Loading environment variables from .env file...

for /f "tokens=*" %%a in (.env) do (
    set line=%%a
    if not "!line:~0,1!"=="#" (
        if not "!line!"=="" (
            set %%a
        )
    )
)

echo Environment variables loaded successfully.
