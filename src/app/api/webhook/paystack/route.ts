import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-paystack-signature');

        // Optional: In test mode or local dev without a secret key, we might skip the exact signature check 
        // if developing locally, but in production this is critical.
        if (process.env.PAYSTACK_SECRET_KEY && signature) {
            const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                            .update(rawBody).digest('hex');
            
            if (hash !== signature) {
                return NextResponse.json({ status: "failed", message: "Invalid Signature" }, { status: 401 });
            }
        }

        const event = JSON.parse(rawBody);

        if (event.event === 'charge.success') {
            const email = event.data.customer.email;
            const reference = event.data.reference;
            const amount = event.data.amount;
            const planType = event.data.metadata?.plan_type || 'termly';
            
            // Idempotency Check: Verify if transaction was already processed
            const txnCheck = await db.execute({
                sql: "SELECT reference FROM transactions WHERE reference = ?",
                args: [reference]
            });
            
            if (txnCheck.rows.length > 0) {
                console.log(`Transaction ${reference} already processed.`);
                return NextResponse.json({ status: "success", message: "Already processed" }, { status: 200 });
            }

            // We need to find the Clerk user by their email
            const client = await clerkClient();
            const users = await client.users.getUserList({
                emailAddress: [email]
            });

            if (users.data.length > 0) {
                const user = users.data[0];
                
                // Calculate Expiry based on plan type
                const now = new Date();
                let expiryDate = new Date();
                if (planType === 'day_pass') {
                    expiryDate = new Date(now.setDate(now.getDate() + 1));
                } else {
                    // Default to termly (3 months)
                    expiryDate = new Date(now.setMonth(now.getMonth() + 3));
                }
                
                // Update the user's public metadata to mark them as premium with expiration
                await client.users.updateUserMetadata(user.id, {
                    publicMetadata: {
                        isPremium: true,
                        premiumUntil: expiryDate.toISOString()
                    }
                });
                console.log(`Successfully upgraded user ${email} to Premium until ${expiryDate.toLocaleString()} (${planType})`);
                
                // Record the successful transaction to prevent double processing
                await db.execute({
                    sql: "INSERT INTO transactions (reference, clerk_id, type, amount, status) VALUES (?, ?, ?, ?, ?)",
                    args: [reference, user.id, planType, amount, 'success']
                });

                console.log(`Successfully upgraded user ${email} to Premium until ${expiryDate.toLocaleString()}`);
            } else {
                console.warn(`Payment successful but no Clerk user found for email: ${email}`);
            }
        }

        return NextResponse.json({ status: "success" }, { status: 200 });

    } catch (e: any) {
        console.error("Paystack Webhook Error:", e);
        return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
    }
}
