import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { SafetyScoreCard } from "@/components/SafetyScoreCard";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { text } from "@/constants/type";
import { useInventory } from "@/lib/inventory";

function formatChecked(iso: string | null) {
  if (!iso) return "Not checked yet";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "Not checked yet";
  return `Last checked ${when.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function headlineFor(confirmed: number, needsCheck: number) {
  if (confirmed > 0) {
    return confirmed === 1 ? "Recall match" : `${confirmed} recall matches`;
  }
  if (needsCheck > 0) {
    return `Check ${needsCheck} product${needsCheck === 1 ? "" : "s"}`;
  }
  return "All clear";
}

export default function HomeScreen() {
  const { safetyScore, activePotentialMatches, matches, lastCheckedAt } = useInventory();
  const router = useRouter();

  const resolveTarget =
    activePotentialMatches[0] ??
    matches.find((m) => m.stage === "confirmed");
  const alertCount = activePotentialMatches.length;

  return (
    <Screen topInset>
      <Wordmark />
      <Text style={text.hero}>
        {headlineFor(safetyScore.confirmedMatch, safetyScore.needsVerification)}
      </Text>
      <Text style={text.muted}>{formatChecked(lastCheckedAt)}</Text>

      {alertCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/alerts/${activePotentialMatches[0].id}`)}
          style={({ pressed }) => pressed && { opacity: 0.92 }}
        >
          <Card tone="warn">
            <Text style={text.product}>Check a product</Text>
            <Text style={text.body}>
              {alertCount} item{alertCount === 1 ? "" : "s"} may match a Canadian recall.
              Open the package before treating it as affected.
            </Text>
          </Card>
        </Pressable>
      ) : null}

      <SafetyScoreCard
        score={safetyScore}
        onResolve={
          resolveTarget
            ? () =>
                router.push(
                  resolveTarget.stage === "confirmed"
                    ? `/action/${resolveTarget.id}`
                    : `/alerts/${resolveTarget.id}`
                )
            : undefined
        }
      />

      <Button label="Scan receipt" onPress={() => router.push("/receipt/scan")} />
      <Button
        label="Add a barcode"
        variant="quiet"
        onPress={() => router.push("/barcode")}
      />
    </Screen>
  );
}
