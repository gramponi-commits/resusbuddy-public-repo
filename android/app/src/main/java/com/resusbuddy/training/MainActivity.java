package com.resusbuddy.training;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Enable edge-to-edge
        EdgeToEdge.enable(this);

        super.onCreate(savedInstanceState);

        // Allow content to extend behind system bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
