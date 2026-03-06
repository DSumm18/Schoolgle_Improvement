import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get survey to build URL
    const { data: survey, error } = await supabase
      .from("surveys")
      .select("slug, title")
      .eq("id", surveyId)
      .single();

    if (error || !survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "https://schoolgle.co.uk";
    const surveyUrl = `${baseUrl}/s/${survey.slug || surveyId}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(surveyUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#0e7490", light: "#ffffff" },
    });

    // Generate embed code
    const embedCode = `<iframe src="${surveyUrl}" width="100%" height="600" frameborder="0" style="border:none;border-radius:8px;"></iframe>`;

    // Generate popup embed code
    const popupCode = `<script>
(function(){var b=document.createElement('div');b.innerHTML='<button onclick="document.getElementById(\\'schoolgle-survey\\').style.display=\\'flex\\'" style="position:fixed;bottom:20px;right:20px;background:#0e7490;color:white;border:none;padding:12px 24px;border-radius:24px;cursor:pointer;font-size:14px;z-index:9999">Give Feedback</button><div id="schoolgle-survey" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;align-items:center;justify-content:center" onclick="if(event.target===this)this.style.display=\\'none\\'"><iframe src="${surveyUrl}" style="width:90%;max-width:640px;height:80vh;border:none;border-radius:12px"></iframe></div>';document.body.appendChild(b);})();
</script>`;

    return NextResponse.json({
      surveyUrl,
      qrCodeDataUrl: qrDataUrl,
      embedCode,
      popupEmbedCode: popupCode,
      slug: survey.slug,
    });
  } catch (error) {
    console.error("Error in GET /api/surveys/[id]/distribute:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { channel, config } = body;

    if (!channel) {
      return NextResponse.json(
        { error: "channel is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("survey_distributions")
      .insert({
        survey_id: surveyId,
        channel,
        config: config || {},
        status: channel === "link" || channel === "qr_code" ? "sent" : "draft",
        sent_at:
          channel === "link" || channel === "qr_code"
            ? new Date().toISOString()
            : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/surveys/[id]/distribute:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
