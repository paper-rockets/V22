package com.paperrockets.v22;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class DebugRegistrar {
    public static void register(BridgeActivity activity) {
        // Strict no-op in benchmark: identical to release
        WebView.setWebContentsDebuggingEnabled(false);
    }
}
