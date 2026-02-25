# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-dontwarn com.getcapacitor.**

# Capacitor Cordova compatibility
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# Firebase Messaging
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
