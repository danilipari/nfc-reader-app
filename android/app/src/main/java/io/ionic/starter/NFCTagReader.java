package io.ionic.starter;

import android.app.Activity;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NFCTagReader")
public class NFCTagReader extends Plugin {

    @PluginMethod
    public void readTagId(PluginCall call) {
        Log.d("NFCTagReader", "readTagId called");
        Activity activity = getActivity();
        Intent intent = activity.getIntent();
        
        Log.d("NFCTagReader", "Intent action: " + intent.getAction());
        
        if (NfcAdapter.ACTION_TAG_DISCOVERED.equals(intent.getAction()) ||
            NfcAdapter.ACTION_NDEF_DISCOVERED.equals(intent.getAction()) ||
            NfcAdapter.ACTION_TECH_DISCOVERED.equals(intent.getAction())) {
            
            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            if (tag != null) {
                byte[] id = tag.getId();
                String tagId = bytesToHex(id);
                
                Log.d("NFCTagReader", "Tag found: " + tagId);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("tagId", tagId);
                result.put("tagIdFormatted", formatTagId(tagId));
                call.resolve(result);
            } else {
                Log.d("NFCTagReader", "No tag found in intent");
                call.reject("No NFC tag found");
            }
        } else {
            Log.d("NFCTagReader", "No NFC intent found");
            call.reject("No NFC intent found");
        }
    }
    
    @PluginMethod
    public void getLastIntent(PluginCall call) {
        Log.d("NFCTagReader", "getLastIntent called");
        Activity activity = getActivity();
        Intent intent = activity.getIntent();
        
        JSObject result = new JSObject();
        if (intent != null) {
            Log.d("NFCTagReader", "Intent action: " + intent.getAction());
            result.put("action", intent.getAction());
            result.put("hasTag", intent.hasExtra(NfcAdapter.EXTRA_TAG));
            
            if (intent.hasExtra(NfcAdapter.EXTRA_TAG)) {
                Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
                if (tag != null) {
                    byte[] id = tag.getId();
                    String tagId = bytesToHex(id);
                    Log.d("NFCTagReader", "Found tag in intent: " + tagId);
                    result.put("tagId", tagId);
                    result.put("tagIdFormatted", formatTagId(tagId));
                }
            } else {
                Log.d("NFCTagReader", "No tag in intent");
            }
        }
        call.resolve(result);
    }
    
    @PluginMethod
    public void testPlugin(PluginCall call) {
        Log.d("NFCTagReader", "testPlugin called - plugin is working!");
        JSObject result = new JSObject();
        result.put("message", "Plugin NFCTagReader is working correctly!");
        call.resolve(result);
    }
    
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02X", b));
        }
        return result.toString();
    }
    
    private String formatTagId(String tagId) {
        StringBuilder formatted = new StringBuilder();
        for (int i = 0; i < tagId.length(); i += 2) {
            if (i > 0) formatted.append(":");
            formatted.append(tagId.substring(i, Math.min(i + 2, tagId.length())));
        }
        return formatted.toString();
    }
}