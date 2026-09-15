package com.paperrockets.v22;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Native source-set isolated registration:
        // In debug builds, registers NativeDebugBridgePlugin and enables WebView debugging.
        // In release and benchmark builds, DebugRegistrar is a no-op that disables WebView debugging.
        DebugRegistrar.register(this);
        super.onCreate(savedInstanceState);
    }
}
