# Saweria Deposit System

## Project Setup
#### 1. Clone the repository
Clone the repository from your version control system
```console
git clone https://github.com/Rann-Studio/saweria-deposit-system
cd saweria-deposit-system
```
#### 2. Install Dependencies
Install the required npm packages:
```console
npm install
```
#### 3. Configure Environment Variables
Create a .env file in the root directory of your project and add the following environment variables:
```
PORT=3000
WEBHOOK_SECRET=your-webhook-secret
```
#### 4. Setup the Database
Run Prisma migrations to set up the SQLite database:
```console
npx prisma migrate dev --name init
```
#### 5. Start the Server
Run the server using the following command:
```console
npm start
```


## API Endpoints
### Deposit Endpoint
**URL**: POST `/deposit`\
**Description**: Creates a new deposit record.\
**Request Body**:
```json
{
    "userId": <user-id>,
    "amount": <amount>
}
```

### Webhook Endpoint
**URL**: POST `/webhook`\
**Description**: Verifies and updates deposit status based on the webhook notification.\
**Query Parameters**:\
`secret`: The webhook secret defined in `.env`\
**Example**: `/webhook?secret=your-webhook-secret`

## Webhook Integration with Saweria
To integrate the webhook with Saweria:
1. Log in to your Saweria account.
2. Navigate to the Integration settings page.
3. Select the Webhook option.
4. Add webhook endpoint with the URL corresponding to your server's `/webhook` endpoint. For example: `https://your-domain.com/webhook?secret=your-webhook-secret`.
5. Save the configuration.
