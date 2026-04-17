import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import {
  DEFAULT_PREFERENCES,
  type SubstitutionPreferences,
} from "@/lib/substitutions/substitution-engine";
import { z } from "zod";

const preferencesSchema = z.object({
  priority: z.enum([
    "same_brand",
    "cheapest",
    "closest_match",
    "organic_preferred",
  ]),
  maxPriceIncrease: z.number().min(0).max(100),
  dietaryStrict: z.boolean(),
  preferOrganic: z.boolean(),
  acceptAutoSubstitute: z.boolean(),
});

async function readPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<SubstitutionPreferences> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("substitution_preferences")
      .eq("id", userId)
      .single();

    if (data?.substitution_preferences) {
      const parsed = preferencesSchema.safeParse(
        data.substitution_preferences
      );
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Fall through to defaults
  }

  return DEFAULT_PREFERENCES;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
    }

    const preferences = await readPreferences(supabase, user.id);

    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid substitution preferences",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ substitution_preferences: parsed.data })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        {
          preferences: parsed.data,
          persisted: false,
          message:
            "Preferences validated but could not be saved. They will persist locally.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      preferences: parsed.data,
      persisted: true,
    });
  } catch {
    return NextResponse.json(
      {
        code: "INTERNAL_ERROR",
        message: "Failed to save substitution preferences",
      },
      { status: 500 }
    );
  }
}
