# PostgreSQL backups

Petory stores posts, accounts, and uploaded image bytes in PostgreSQL. A backup
must include the whole database, not just selected tables. Keep encrypted
copies **outside the Linux host**; a local Docker volume is not a backup.

After setting a private backup directory, create a custom-format dump from the
running database container:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml exec -T database \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > /path/to/private-backups/petory-YYYYMMDD.dump
```

Check the command exit code and verify the archive with `pg_restore -l` before
copying it to an off-host destination. Schedule daily backups, retain multiple
generations, and alert on missed or failed runs. Periodically restore a copy to
an **isolated disposable database** and test login, a post, and an uploaded
image. Never perform a restore against the live database without a planned
maintenance window and a fresh verified backup; restore can replace live data.
