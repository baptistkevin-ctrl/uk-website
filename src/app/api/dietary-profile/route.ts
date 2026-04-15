import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const DIET_TYPES = [
  "none",
  "vegetarian",
  "vegan",
  "pescatarian",
  "keto",
  "paleo",
] as const;

const dietaryProfileSchema = z.object({
  dietType: z.enum(DIET_TYPES),
  allergies: z.array(z.string().max(100)).max(50),
  intolerances: z.array(z.string().max(100)).max(50),
  preferences: z.array(z.string().max(100)).max(50),
  avoidIngredients: z.array(z.string().max(200)).max(100),
  householdSize: z.number().int().min(1).max(10),
  isActive: z.boolean(),
});

type DietaryProfile = z.infer<typeof dietaryProfileSchema>;

const DEFAULT_PROFILE: DietaryProfile = {
  dietType: "none",
  allergies: [],
  intolerances: [],
  preferences: [],
  avoidIngredients: [],
  householdSize: 2,
  isActive: false,
};

async function tryReadDietaryPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<DietaryProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("dietary_preferences")
      .eq("id", userId)
      .single();

    if (error) return null;

    const raw = data?.dietary_preferences;
    if (!raw || typeof raw !== "object") return null;

    const parsed = dietaryProfileSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function tryWriteDietaryPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  profile: DietaryProfile
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ dietary_preferences: profile })
      .eq("id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ profile: DEFAULT_PROFILE });
    }

    const profile = await tryReadDietaryPreferences(supabase, user.id);

    return NextResponse.json({
      profile: profile ?? DEFAULT_PROFILE,
    });
  } catch {
    return NextResponse.json({ profile: DEFAULT_PROFILE });
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
    const parsed = dietaryProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid dietary profile data",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const saved = await tryWriteDietaryPreferences(
      supabase,
      user.id,
      parsed.data
    );

    if (!saved) {
      return NextResponse.json(
        {
          profile: parsed.data,
          persisted: false,
          message:
            "Profile validated but could not be saved to the database. It will persist locally.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      profile: parsed.data,
      persisted: true,
    });
  } catch {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Failed to save dietary profile" },
      { status: 500 }
    );
  }
}
