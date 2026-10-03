package com.aliverbiopharm.app

import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import android.webkit.MimeTypeMap

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var offlineView: View
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooser =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            filePathCallback?.onReceiveValue(uri?.let { arrayOf(it) })
            filePathCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }

        webView = WebView(this)
        offlineView = createOfflineView()

        root.addView(webView, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(offlineView, LinearLayout.LayoutParams(-1, -1))
        setContentView(root)

        configureWebView()

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            setSupportZoom(false)
        }

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (uri.scheme == "https" && isAllowedHost(uri.host)) return false

                openExternal(uri)
                return true
            }

            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                showWebView()
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) showOffline()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                val mime = params.acceptTypes.firstOrNull { it.isNotBlank() } ?: "*/*"
                fileChooser.launch(mime)
                return true
            }
        }

        webView.setDownloadListener(DownloadListener { url, _, _, mimeType, _ ->
            openExternal(Uri.parse(url))
        })
    }

    private fun createOfflineView(): View {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(48, 48, 48, 48)
            visibility = View.GONE

            addView(TextView(this@MainActivity).apply {
                text = "AliverBiopharm is offline"
                textSize = 22f
                gravity = android.view.Gravity.CENTER
            })

            addView(TextView(this@MainActivity).apply {
                text = "Check your internet connection and try again."
                textSize = 16f
                gravity = android.view.Gravity.CENTER
                setPadding(0, 16, 0, 24)
            })

            addView(Button(this@MainActivity).apply {
                text = "Retry"
                setOnClickListener { webView.loadUrl(APP_URL) }
            })
        }
    }

    private fun showOffline() {
        webView.visibility = View.GONE
        offlineView.visibility = View.VISIBLE
    }

    private fun showWebView() {
        webView.visibility = View.VISIBLE
        offlineView.visibility = View.GONE
    }

    private fun isAllowedHost(host: String?): Boolean {
        if (host == null) return false
        return host == "aliverbiopharm.com" ||
            host == "www.aliverbiopharm.com" ||
            host.endsWith(".supabase.co")
    }

    private fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        filePathCallback?.onReceiveValue(null)
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val APP_URL = "https://aliverbiopharm.com/"
    }
}
