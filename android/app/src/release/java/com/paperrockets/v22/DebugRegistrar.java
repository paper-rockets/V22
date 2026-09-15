package com.paperrockets.v22;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class DebugRegistrar {
    public static void register(BridgeActivity activity) {
        // Strict no-op in release: WebView debugging strictly disabled, no debug plugin registered
        WebView.setWebContentsDebuggingEnabled(false);
    }
}
