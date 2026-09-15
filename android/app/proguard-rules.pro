# Project specific ProGuard/R8 rules for V22

# Capacitor core and plugin reflection keep rules
-keep public class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keep class com.getcapacitor.BridgeActivity { *; }
-keep public class * extends com.getcapacitor.BridgeActivity { *; }

# Preserve WebView Javascript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX keep rules
-keep class androidx.appcompat.** { *; }
-keep class androidx.coordinatorlayout.** { *; }
