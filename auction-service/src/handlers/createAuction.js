import validator from '@middy/validator';
import AWS from 'aws-sdk';
import createError from 'http-errors';
import { v4 as uuid } from 'uuid';
import commonMiddleware from '../lib/commonMiddleware';
import createAuctionSchema from '../lib/schemas/createAuctionSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  console.log('1-create');

  const { title } = event.body;
  console.log(title);

  const { email } = event.requestContext.authorizer;
  console.log(email);

  const now = new Date();
  console.log(now.toISOString());

  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);
  console.log(endDate.toISOString());

  const auction = {
    id: uuid(),
    title,
    status: 'OPEN',
    createAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  };

  console.log('2-create auction');

  try {
    await dynamodb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(createAuction).use(
  validator({ inputSchema: createAuctionSchema })
);
