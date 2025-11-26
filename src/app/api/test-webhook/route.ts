import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('\n🔍 ========== WEBHOOK DEBUG INFO ==========');
        console.log('Full Payload:', JSON.stringify(body, null, 2));

        // Extract messages
        if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
            const messages = body.entry[0].changes[0].value.messages;
            console.log('\n📨 Messages received:', messages.length);

            messages.forEach((msg: any, index: number) => {
                console.log(`\nMessage ${index + 1}:`);
                console.log(`  Type: ${msg.type}`);
                console.log(`  ID: ${msg.id}`);

                if (msg.image) {
                    console.log('  📸 IMAGE DETECTED!');
                    console.log(`    Media ID: ${msg.image.id}`);
                    console.log(`    MIME Type: ${msg.image.mime_type}`);
                    console.log(`    SHA256: ${msg.image.sha256}`);
                    console.log(`    Caption: ${msg.image.caption || 'none'}`);
                }

                if (msg.video) {
                    console.log('  🎥 VIDEO DETECTED!');
                    console.log(`    Media ID: ${msg.video.id}`);
                }

                if (msg.document) {
                    console.log('  📄 DOCUMENT DETECTED!');
                    console.log(`    Media ID: ${msg.document.id}`);
                    console.log(`    Filename: ${msg.document.filename}`);
                }
            });
        }

        console.log('========== END DEBUG INFO ==========\n');

        return NextResponse.json({
            status: 'logged',
            message: 'Check server console for details'
        });

    } catch (error: any) {
        console.error('Debug endpoint error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Webhook debug endpoint active. Send a POST request to test.'
    });
}
