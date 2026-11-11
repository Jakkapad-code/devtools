# Gmail SMTP for password recovery

Mail delivery is disabled by default. To enable Gmail on a private host, create
an app password for an account with two-step verification. A university account
may require an administrator to allow app passwords and SMTP. Revoke any app
password that has been disclosed, and generate a new one.

Add these values to your untracked `.env.local`, replacing the placeholders:

```dotenv
MAIL_PROVIDER=gmail
MAIL_FROM=your-account@gmail.com
GMAIL_USER=your-account@gmail.com
GMAIL_APP_PASSWORD=your-new-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`MAIL_FROM` must match `GMAIL_USER`. Never commit or share the app password.
Restart Next.js after changing the environment. The reset link uses
`NEXT_PUBLIC_APP_URL`; when sending to another person, set it to the actual
trusted HTTPS origin that the recipient can reach. Localhost works only on the
same machine. Gmail SMTP uses implicit TLS on port 465.

The Cloudflare quick demo intentionally forces `MAIL_PROVIDER=disabled` and is
only for mock accounts. It does not inherit the Gmail settings. Do not remove
that safeguard to expose real user data. For real email, configure a separate,
protected environment and verified, stable public address. Google may enforce
account or sending limits and institutional policy.
