package com.paperrockets.v22;

import android.content.Context;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.util.DisplayMetrics;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeDebugBridge")
public class NativeDebugBridgePlugin extends Plugin {

    private static JSObject latestTelemetry = new JSObject();

    public static JSObject getLatestTelemetry() {
        return latestTelemetry;
    }

    @PluginMethod
    public void getDebugAuthorization(PluginCall call) {
        if (!BuildConfig.ENABLE_TEST_BRIDGE) {
            JSObject res = new JSObject();
            res.put("isAuthorized", false);
            res.put("buildVariant", "release");
            call.resolve(res);
            return;
        }

        JSObject res = new JSObject();
        res.put("isAuthorized", true);
        res.put("buildVariant", BuildConfig.BUILD_VARIANT);
        res.put("appId", getContext().getPackageName());
        res.put("versionName", BuildConfig.VERSION_NAME);
        res.put("versionCode", BuildConfig.VERSION_CODE);
        res.put("deviceManufacturer", Build.MANUFACTURER);
        res.put("deviceModel", Build.MODEL);
        res.put("androidVersion", Build.VERSION.RELEASE);
        res.put("sdkInt", Build.VERSION.SDK_INT);
        call.resolve(res);
    }

    @PluginMethod
    public void getSystemDiagnostics(PluginCall call) {
        if (!BuildConfig.ENABLE_TEST_BRIDGE) {
            call.reject("Test bridge not authorized in this build");
            return;
        }

        Context ctx = getContext();
        DisplayMetrics dm = ctx.getResources().getDisplayMetrics();

        long freeBytes = 0;
        long totalBytes = 0;
        try {
            StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
            freeBytes = stat.getAvailableBytes();
            totalBytes = stat.getTotalBytes();
        } catch (Exception ignored) {}

        JSObject res = new JSObject();
        res.put("screenWidth", dm.widthPixels);
        res.put("screenHeight", dm.heightPixels);
        res.put("screenDensity", (double) dm.density);
        res.put("densityDpi", dm.densityDpi);
        res.put("storageFreeBytes", (double) freeBytes);
        res.put("storageTotalBytes", (double) totalBytes);
        res.put("buildVariant", BuildConfig.BUILD_VARIANT);
        res.put("appId", ctx.getPackageName());
        res.put("manufacturer", Build.MANUFACTURER);
        res.put("model", Build.MODEL);
        res.put("androidVersion", Build.VERSION.RELEASE);
        call.resolve(res);
    }

    @PluginMethod
    public void recordTestTelemetry(PluginCall call) {
        JSObject data = call.getData();
        if (data != null) {
            latestTelemetry = data;
            android.util.Log.i("V22NativeTelemetry", data.toString());
        }
        call.resolve();
    }
}
