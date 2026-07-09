import { POST } from "../route";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Mock dependencies
jest.mock("stripe");
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return { body, init };
    }),
  },
}));

// Mock custom modules to prevent real execution during test
jest.mock("@/lib/popcustoms", () => ({
  submitOrderToPopCustoms: jest.fn(),
}));

jest.mock("@/lib/db/drizzle", () => ({
  db: {
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  loyaltyEscrow: {},
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
}));

jest.mock("@/lib/midnight/mint-receipt", () => ({
  mintZkReceipt: jest.fn(),
}));

describe("Stripe Webhook Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set required environment variables for the test
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
  });

  it("should return a 400 error response if signature verification fails", async () => {
    // Mock constructEvent to throw an error
    const errorMessage = "Invalid signature";
    const mockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

    // We need to mock the webhooks.constructEvent on the instance created in the handler
    mockedStripe.mockImplementation(() => {
      return {
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error(errorMessage);
          }),
        },
      } as unknown as Stripe;
    });

    // Create a mock Request
    const req = {
      text: jest.fn().mockResolvedValue(JSON.stringify({ type: "some_event" })),
      headers: {
        get: jest.fn().mockReturnValue("invalid_signature")
      }
    } as unknown as Request;

    // Call the POST handler
    const response = await POST(req);

    // Verify NextResponse.json was called with the correct arguments
    expect(NextResponse.json).toHaveBeenCalledWith(
      { received: true, error: `Webhook Signature Error: ${errorMessage}` },
      { status: 400 }
    );
  });
});
