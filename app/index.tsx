import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

const { InstagramGuard } = NativeModules;
const { width, height } = Dimensions.get("window");

const REQUIRE_BRAIN_PUZZLE = true;

type BannerKind = "none" | "info" | "success" | "warning" | "error";

type Step = "PUZZLE" | "QUOTE_1" | "QUOTE_2" | "QUOTE_3";

export default function Index() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isServiceRunning, setIsServiceRunning] = useState(false);

  const [banner, setBanner] = useState<{ kind: BannerKind; msg: string }>({
    kind: "none",
    msg: "",
  });

  // Sheets
  const [showPermSheet, setShowPermSheet] = useState(false);
  const [showPuzzleSheet, setShowPuzzleSheet] = useState(false);

  // Modal flow steps
  const [step, setStep] = useState<Step>("PUZZLE");

  // Keyboard insets so nothing is covered
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const onShow = Keyboard.addListener("keyboardDidShow", (e) =>
      setKbHeight(e.endCoordinates?.height ?? 0)
    );
    const onHide = Keyboard.addListener("keyboardDidHide", () =>
      setKbHeight(0)
    );
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  // Puzzle state
  const [puzzle, setPuzzle] = useState<{ q: string; a: string } | null>(null);
  const [answer, setAnswer] = useState("");

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const C = useMemo(
    () => ({
      bg: isDark ? "#0B0B0C" : "#FFFFFF",
      card: isDark ? "#101113" : "#F7F8FA",
      card2: isDark ? "#0E0F11" : "#F3F4F6",
      border: isDark ? "#1A1C1F" : "#E6E8EC",
      text: isDark ? "#F2F3F5" : "#0B0C0E",
      sub: isDark ? "#8A919E" : "#606775",
      accent: "#4F7AFE",
      good: "#10B981",
      bad: "#EF4444",
      inputBg: isDark ? "#15171A" : "#FFFFFF",
      inputBorder: isDark ? "#23262B" : "#DDE1E6",
      shadow: isDark ? "#000000" : "#0B0C0E",
    }),
    [isDark]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
      alignItems: "center",
      paddingTop: 48,
      paddingHorizontal: 20,
      gap: 20,
    },
    headerIcon: {
      width: 72,
      height: 72,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: C.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    headerDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: C.bad,
      position: "absolute",
      right: -2,
      top: -2,
      borderWidth: 2,
      borderColor: C.bg,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.3,
      color: C.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: C.sub,
      textAlign: "center",
      marginTop: -6,
      lineHeight: 21,
    },
    card: {
      width: width * 0.92,
      backgroundColor: C.card,
      borderRadius: 18,
      padding: 22,
      borderWidth: 1,
      borderColor: C.border,
      shadowColor: C.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: C.text,
    },
    status: {
      marginTop: 14,
      fontSize: 13,
      fontWeight: "600",
    },
    statusActive: { color: C.good },
    statusInactive: { color: C.bad },
    divider: {
      height: 1,
      backgroundColor: C.border,
      marginVertical: 18,
      opacity: 0.8,
    },
    lineItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.sub,
      opacity: 0.6,
    },
    lineText: { color: C.sub, fontSize: 14 },
    controlsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 6,
      flexWrap: "wrap",
    },
    button: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card2,
    },
    buttonText: {
      color: C.text,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.1,
    },

    // Banner
    banner: {
      width: width * 0.92,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
    },
    bannerText: { fontSize: 13, lineHeight: 18, fontWeight: "600" },

    // Sheet (no scroll; compact)
    sheetWrap: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: C.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 18,
      borderTopWidth: 1,
      borderColor: C.border,
      gap: 14,
    },
    sheetHandle: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: C.border,
      marginBottom: 8,
      opacity: 0.9,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: C.text,
      textAlign: "center",
      letterSpacing: -0.2,
    },
    sheetSub: {
      fontSize: 14,
      color: C.sub,
      textAlign: "center",
      lineHeight: 20,
      marginTop: -4,
      marginBottom: 4,
    },
    pill: {
      alignSelf: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: C.card2,
      borderWidth: 1,
      borderColor: C.border,
    },
    pillText: { fontSize: 12, color: C.sub, fontWeight: "700" },
    puzzleCard: {
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      padding: 16,
    },
    puzzleQ: {
      color: C.text,
      fontWeight: "800",
      fontSize: 20,
      textAlign: "center",
      letterSpacing: 0.2,
    },
    input: {
      backgroundColor: C.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.inputBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: C.text,
      fontSize: 18,
      textAlign: "center",
      marginTop: 12,
    },
    tinyHint: {
      textAlign: "center",
      color: C.sub,
      fontSize: 12,
      marginTop: 8,
    },
    sheetRow: { flexDirection: "row", gap: 10 },
    primaryBtn: {
      flex: 1,
      backgroundColor: C.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { color: "#fff", fontWeight: "800", letterSpacing: 0.2 },
    ghostBtn: {
      flex: 1,
      backgroundColor: C.card2,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    ghostText: { color: C.text, fontWeight: "800", letterSpacing: 0.2 },

    quoteBig: {
      fontSize: 20,
      color: C.text,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 26,
      letterSpacing: 0.1,
      marginTop: 8,
    },
    quoteSmall: {
      fontSize: 12,
      color: C.sub,
      textAlign: "center",
      marginTop: 6,
    },
  });

  // ---------------- Permissions

  const checkPermissions = async (): Promise<boolean> => {
    try {
      const isServiceEnabled = await InstagramGuard.isServiceEnabled();
      const hasUsageAccess = await InstagramGuard.hasUsageAccessPermission();
      return isServiceEnabled && hasUsageAccess;
    } catch {
      return false;
    }
  };

  const openAccessibilitySettings = async () => {
    try {
      await InstagramGuard.openAccessibilitySettings();
    } catch {}
  };

  const openUsageAccessSettings = async () => {
    try {
      await InstagramGuard.openUsageAccessSettings();
    } catch {}
  };

  // ---------------- Puzzles (normal math; one line; integer answers)

  const ri = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const genPuzzle = (): { q: string; a: string } => {
    // Choose from 4 neat formats; all integer results; visually nice.
    const type = ri(1, 4);

    if (type === 1) {
      // (a + b) × c − d
      const a = ri(4, 12),
        b = ri(3, 11),
        c = ri(2, 9),
        d = ri(5, 20);
      const ans = (a + b) * c - d;
      return { q: `(${a} + ${b}) × ${c} − ${d} = ?`, a: String(ans) };
    }
    if (type === 2) {
      // a × b + c × d
      const a = ri(3, 9),
        b = ri(3, 9),
        c = ri(2, 8),
        d = ri(2, 8);
      const ans = a * b + c * d;
      return { q: `${a} × ${b} + ${c} × ${d} = ?`, a: String(ans) };
    }
    if (type === 3) {
      // (a × b) − (c × d)
      const a = ri(3, 9),
        b = ri(4, 9),
        c = ri(2, 8),
        d = ri(2, 8);
      const ans = a * b - c * d;
      return { q: `(${a} × ${b}) − (${c} × ${d}) = ?`, a: String(ans) };
    }
    // type 4: a + b × c − d ÷ e  with integer division
    const e = ri(2, 9);
    const d = e * ri(2, 9);
    const a = ri(5, 18),
      b = ri(2, 9),
      c = ri(2, 9);
    const ans = a + b * c - d / e;
    return { q: `${a} + ${b} × ${c} − ${d} ÷ ${e} = ?`, a: String(ans) };
  };

  const openPuzzle = () => {
    setStep("PUZZLE");
    setPuzzle(genPuzzle());
    setAnswer("");
    setShowPuzzleSheet(true);
  };

  const onPuzzleSubmit = () => {
    if (!puzzle) return;
    const ok = answer.trim() === puzzle.a.trim();
    if (!ok) {
      setBanner({ kind: "warning", msg: "Wrong answer. Try again." });
      return;
    }
    // advance to quotes flow
    setBanner({ kind: "info", msg: "Nice. Two taps to stay on track." });
    setStep("QUOTE_1");
  };

  const quotes: Record<
    Exclude<Step, "PUZZLE">,
    { line: string; by: string }
  > = {
    QUOTE_1: {
      line: "Talent wins games, but teamwork and intelligence win championships.",
      by: "— Michael Jordan",
    },
    QUOTE_2: {
      line: "I don’t have time for hobbies. At the end of the day, I treat my job as a hobby anyway.",
      by: "— Lionel Messi",
    },
    QUOTE_3: {
      line: "Dreams are not what you see in sleep; dreams are the things which do not let you sleep.",
      by: "— Cristiano Ronaldo",
    },
  };

  // ---------------- Toggle

  const handleToggle = async (value: boolean) => {
    if (Platform.OS !== "android") {
      setBanner({ kind: "error", msg: "Android only." });
      return;
    }

    if (value) {
      const okPerms = await checkPermissions();
      if (!okPerms) {
        setShowPermSheet(true);
        setBanner({
          kind: "info",
          msg: "Grant Accessibility & Usage Access to enable.",
        });
        return;
      }
      await InstagramGuard.startService();
      setIsEnabled(true);
      setIsServiceRunning(true);
      setBanner({ kind: "success", msg: "Guard enabled." });
      return;
    }

    if (REQUIRE_BRAIN_PUZZLE && isEnabled) {
      openPuzzle();
      return;
    }

    await InstagramGuard.stopService();
    setIsEnabled(false);
    setIsServiceRunning(false);
    setBanner({ kind: "success", msg: "Guard disabled." });
  };

  // ---------------- Init

  useEffect(() => {
    const init = async () => {
      if (Platform.OS !== "android") return;
      try {
        const on = await InstagramGuard.isServiceEnabled();
        setIsEnabled(on);
        setIsServiceRunning(on);
      } catch {}
    };
    init();
  }, []);

  const bannerPalette = useMemo(() => {
    switch (banner.kind) {
      case "success":
        return {
          bg: isDark ? "#0F1A14" : "#ECFDF5",
          border: "#10B981",
          fg: isDark ? "#A7F3D0" : "#065F46",
        };
      case "warning":
        return {
          bg: isDark ? "#1A150A" : "#FFFBEB",
          border: "#F59E0B",
          fg: isDark ? "#FDE68A" : "#92400E",
        };
      case "error":
        return {
          bg: isDark ? "#1B0E10" : "#FEF2F2",
          border: "#EF4444",
          fg: isDark ? "#FCA5A5" : "#7F1D1D",
        };
      case "info":
        return {
          bg: isDark ? "#0E1420" : "#EFF6FF",
          border: "#3B82F6",
          fg: isDark ? "#93C5FD" : "#1E3A8A",
        };
      default:
        return null;
    }
  }, [banner.kind, isDark]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={C.bg}
      />

      {/* Icon */}
      <View style={styles.headerIcon}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.headerIcon}
        />
        <View style={styles.headerDot} />
      </View>

      <Text style={styles.title}>NoScroll</Text>
      <Text style={styles.subtitle}>
        Keep Instagram productive. Reels only when sent by friends or tapped in
        feed.
      </Text>

      {/* Enable card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Guard</Text>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: "#9AA0A6", true: C.accent }}
            thumbColor={isEnabled ? "#FFFFFF" : "#F4F5F6"}
            ios_backgroundColor="#3e3e3e"
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>

        <Text
          style={[
            styles.status,
            isServiceRunning ? styles.statusActive : styles.statusInactive,
          ]}
        >
          {isServiceRunning ? "Guard Active" : "Guard Inactive"}
        </Text>

        <View style={styles.divider} />

        <View style={styles.lineItem}>
          <View style={styles.dot} />
          <Text style={styles.lineText}>Feed & DMs work normally</Text>
        </View>
        <View style={styles.lineItem}>
          <View style={styles.dot} />
          <Text style={styles.lineText}>
            Reels from DMs/Feed: single view allowed
          </Text>
        </View>
        <View style={styles.lineItem}>
          <View style={styles.dot} />
          <Text style={styles.lineText}>
            Reels tab & scroll: kicked out immediately
          </Text>
        </View>

        <View style={[styles.controlsRow, { marginTop: 16 }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              const ok = await checkPermissions();
              setBanner({
                kind: ok ? "success" : "warning",
                msg: ok
                  ? "Permissions OK."
                  : "Permissions missing. Open settings below.",
              });
              if (!ok) setShowPermSheet(true);
            }}
          >
            <Text style={styles.buttonText}>Check Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner */}
      {bannerPalette && banner.kind !== "none" && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: bannerPalette.bg,
              borderColor: bannerPalette.border,
            },
          ]}
        >
          <Text style={[styles.bannerText, { color: bannerPalette.fg }]}>
            {banner.msg}
          </Text>
        </View>
      )}

      {/* Permission Sheet */}
      <Modal
        visible={showPermSheet}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPermSheet(false)}
      >
        <TouchableWithoutFeedback
          onPress={(e) => {
            console.log("[NoScroll] Background pressed");
            // Only close if background is pressed, not the sheet itself
            if (e.target === e.currentTarget) setShowPermSheet(false);
          }}
        >
          <View style={styles.sheetWrap}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ width: "100%" }}
              keyboardVerticalOffset={Platform.select({ ios: 12, android: 0 })}
            >
              <View style={[styles.sheet, { paddingBottom: 18 + kbHeight }]}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Permissions needed</Text>
                <Text style={styles.sheetSub}>
                  Grant Accessibility Service & Usage Access so NoScroll can
                  detect and control Reels contexts.
                </Text>

                <View style={[styles.sheetRow, { marginTop: 10 }]}>
                  <TouchableOpacity
                    style={styles.ghostBtn}
                    onPress={openAccessibilitySettings}
                  >
                    <Text style={styles.ghostText}>Open Accessibility</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ghostBtn}
                    onPress={openUsageAccessSettings}
                  >
                    <Text style={styles.ghostText}>Open Usage Access</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.sheetRow, { marginTop: 10 }]}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={async () => {
                      const ok = await checkPermissions();
                      if (ok) {
                        setShowPermSheet(false);
                        await InstagramGuard.startService();
                        setIsEnabled(true);
                        setIsServiceRunning(true);
                        setBanner({ kind: "success", msg: "Guard enabled." });
                      } else {
                        setBanner({
                          kind: "warning",
                          msg: "Still missing permissions. Open settings above.",
                        });
                      }
                    }}
                  >
                    <Text style={styles.primaryText}>I’ve Granted Them</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, { marginTop: 8, alignSelf: "center" }]}
                  onPress={() => setShowPermSheet(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Puzzle + 3 motivational slides (no scroll) */}
      <Modal
        visible={showPuzzleSheet}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPuzzleSheet(false)}
      >
        <TouchableWithoutFeedback
          onPress={(e) => {
            console.log("[NoScroll] Background pressed");
            // Only close if background is pressed, not the sheet itself
            if (e.target === e.currentTarget) setShowPuzzleSheet(false);
          }}
        >
          <View style={styles.sheetWrap}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ width: "100%" }}
              keyboardVerticalOffset={Platform.select({ ios: 12, android: 0 })}
            >
              <View style={[styles.sheet, { paddingBottom: 18 + kbHeight }]}>
                <View style={styles.sheetHandle} />
                {/* Step pill */}
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {step === "PUZZLE"
                      ? "Step 1 of 4"
                      : step === "QUOTE_1"
                      ? "Step 2 of 4"
                      : step === "QUOTE_2"
                      ? "Step 3 of 4"
                      : "Step 4 of 4"}
                  </Text>
                </View>

                {step === "PUZZLE" && (
                  <>
                    <Text style={styles.sheetTitle}>Is it that deep?</Text>
                    <Text style={styles.sheetSub}>
                      Solve the small puzzle. Stay intentional.
                    </Text>
                    <View style={styles.puzzleCard}>
                      <Text style={styles.puzzleQ}>{puzzle?.q ?? ""}</Text>
                      <TextInput
                        placeholder="Answer"
                        placeholderTextColor={isDark ? "#6B7280" : "#9AA0A6"}
                        keyboardType="numeric"
                        value={answer}
                        onChangeText={setAnswer}
                        style={styles.input}
                        returnKeyType="done"
                        onSubmitEditing={onPuzzleSubmit}
                      />
                    </View>

                    <View style={[styles.sheetRow, { marginTop: 10 }]}>
                      <TouchableOpacity
                        style={styles.ghostBtn}
                        onPress={() => setShowPuzzleSheet(false)}
                      >
                        <Text style={styles.ghostText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={onPuzzleSubmit}
                      >
                        <Text style={styles.primaryText}>Check</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {step === "QUOTE_1" && (
                  <>
                    <Text style={styles.sheetTitle}>Mindset</Text>
                    <Text style={styles.quoteBig}>{quotes.QUOTE_1.line}</Text>
                    <Text style={styles.quoteSmall}>{quotes.QUOTE_1.by}</Text>
                    <View style={[styles.sheetRow, { marginTop: 16 }]}>
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => setStep("QUOTE_2")}
                      >
                        <Text style={styles.primaryText}>Next</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {step === "QUOTE_2" && (
                  <>
                    <Text style={styles.sheetTitle}>Consistency</Text>
                    <Text style={styles.quoteBig}>{quotes.QUOTE_2.line}</Text>
                    <Text style={styles.quoteSmall}>{quotes.QUOTE_2.by}</Text>
                    <View style={[styles.sheetRow, { marginTop: 16 }]}>
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => setStep("QUOTE_3")}
                      >
                        <Text style={styles.primaryText}>Next</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {step === "QUOTE_3" && (
                  <>
                    <Text style={styles.sheetTitle}>Drive</Text>
                    <Text style={styles.quoteBig}>{quotes.QUOTE_3.line}</Text>
                    <Text style={styles.quoteSmall}>{quotes.QUOTE_3.by}</Text>
                    <View style={[styles.sheetRow, { marginTop: 16 }]}>
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={async () => {
                          // Finalize disable
                          await InstagramGuard.stopService();
                          setIsEnabled(false);
                          setIsServiceRunning(false);
                          setBanner({
                            kind: "success",
                            msg: "Guard disabled. Stay sharp.",
                          });
                          setShowPuzzleSheet(false);
                        }}
                      >
                        <Text style={styles.primaryText}>Finish & Disable</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
