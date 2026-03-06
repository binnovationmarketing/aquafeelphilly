# Instructions for Customizing Supabase Email Template

To customize the confirmation email sent to new users, you need to update the settings in your Supabase Dashboard.

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** -> **Email Templates**.
3.  Select **Confirm Signup**.
4.  Change the **Subject** to: `Aquafeel Tech - Confirmation Login`
5.  Replace the **Body** with the HTML code below.

## Email Body HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #020d1a;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #00aeef;
    }
    .message {
      line-height: 1.6;
      margin-bottom: 30px;
      color: #555555;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      background-color: #00aeef;
      color: #ffffff;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-block;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999999;
      border-top: 1px solid #eeeeee;
    }
    .signature {
      margin-top: 40px;
      border-top: 1px solid #eeeeee;
      padding-top: 20px;
    }
    .signature p {
      margin: 5px 0;
      font-weight: bold;
      color: #333333;
    }
    .signature .role {
      font-weight: normal;
      color: #777777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Aquafeel Tech</h1>
    </div>
    <div class="content">
      <div class="greeting">
        Welcome, {{ .Data.first_name }}!
      </div>
      <div class="message">
        <p>Thank you for joining our team of elite analysts. We are thrilled to have you on board.</p>
        <p>To access your dashboard and start using the Aquafeel Intelligence System, please confirm your email address by clicking the button below.</p>
        <p>We wish you great success in your journey with us.</p>
      </div>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Login</a>
      </div>
      
      <div class="signature">
        <p>Carlos Henrique Silva</p>
        <div class="role">CEO - Aquos Tech</div>
        <div class="role">Sr. Manager - Aquafeel Philly</div>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2025 Aquos Tech. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```
