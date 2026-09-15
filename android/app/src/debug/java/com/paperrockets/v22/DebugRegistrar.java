package com.paperrockets.v22;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Base64;
import android.util.Log;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class DebugRegistrar {
    private static BroadcastReceiver testReceiver = null;

    public static void register(BridgeActivity activity) {
        if (BuildConfig.ENABLE_TEST_BRIDGE) {
            activity.registerPlugin(NativeDebugBridgePlugin.class);
            WebView.setWebContentsDebuggingEnabled(true);

            if (testReceiver == null) {
                testReceiver = new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context context, Intent intent) {
                        if ("com.paperrockets.v22.TEST_COMMAND".equals(intent.getAction())) {
                            String b64 = intent.getStringExtra("b64js");
                            String js = (b64 != null) 
                                ? new String(Base64.decode(b64, Base64.NO_WRAP)) 
                                : intent.getStringExtra("js");
                            String callbackId = intent.getStringExtra("callbackId");
                            if (js != null && activity.getBridge() != null && activity.getBridge().getWebView() != null) {
                                activity.runOnUiThread(() -> {
                                    activity.getBridge().getWebView().evaluateJavascript(js, result -> {
                                        Log.i("V22TestResult", (callbackId != null ? callbackId + ":::" : "") + result);
                                    });
                                });
                            }
                        }
                    }
                };
                IntentFilter filter = new IntentFilter("com.paperrockets.v22.TEST_COMMAND");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    activity.registerReceiver(testReceiver, filter, Context.RECEIVER_EXPORTED);
                } else {
                    activity.registerReceiver(testReceiver, filter);
                }
            }
        } else {
            WebView.setWebContentsDebuggingEnabled(false);
        }
    }
}

