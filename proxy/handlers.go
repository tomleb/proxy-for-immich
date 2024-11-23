package main

import (
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

type APIReverseProxy struct {
	reverseProxy *httputil.ReverseProxy
}

func NewAPIReverseProxy(upstream string, host string) (*APIReverseProxy, error) {
	upstreamURL, err := url.Parse(upstream)
	if err != nil {
		return nil, fmt.Errorf("parse url %q: %w", upstream, err)
	}

	reverseProxy := &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			rewriteRequestURL(req, upstreamURL)
			headers := http.Header{}
			fmt.Println(req.Header)

			allowedHeaders := []string{
				"X-Forwarded-For",
				"X-Forwarded-Host",
				"X-Forwarded-Proto",
				"User-Agent",
			}
			for _, header := range allowedHeaders {
				vals, ok := req.Header[header]
				if !ok {
					continue
				}

				for _, val := range vals {
					headers.Add(header, val)
				}
			}
			req.Header = headers
			req.Host = host
		},
		ModifyResponse: func(resp *http.Response) error {
			if resp.StatusCode == http.StatusForbidden {
				slog.Error("attempt to access api forbidden", "path", resp.Request.URL.Path)
			}
			return nil
		},
	}

	return &APIReverseProxy{
		reverseProxy: reverseProxy,
	}, nil
}

func (a *APIReverseProxy) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	a.reverseProxy.ServeHTTP(w, req)
}

// Copied from stdlib
func rewriteRequestURL(req *http.Request, target *url.URL) {
	targetQuery := target.RawQuery
	req.URL.Scheme = target.Scheme
	req.URL.Host = target.Host
	req.URL.Path, req.URL.RawPath = joinURLPath(target, req.URL)
	if targetQuery == "" || req.URL.RawQuery == "" {
		req.URL.RawQuery = targetQuery + req.URL.RawQuery
	} else {
		req.URL.RawQuery = targetQuery + "&" + req.URL.RawQuery
	}
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}

func joinURLPath(a, b *url.URL) (path, rawpath string) {
	if a.RawPath == "" && b.RawPath == "" {
		return singleJoiningSlash(a.Path, b.Path), ""
	}
	// Same as singleJoiningSlash, but uses EscapedPath to determine
	// whether a slash should be added
	apath := a.EscapedPath()
	bpath := b.EscapedPath()

	aslash := strings.HasSuffix(apath, "/")
	bslash := strings.HasPrefix(bpath, "/")

	switch {
	case aslash && bslash:
		return a.Path + b.Path[1:], apath + bpath[1:]
	case !aslash && !bslash:
		return a.Path + "/" + b.Path, apath + "/" + bpath
	}
	return a.Path + b.Path, apath + bpath
}

func FileServerWithFallback(root string) http.Handler {
	return http.FileServer(DirWithFallback{http.Dir(root)})
}

type DirWithFallback struct {
	http.Dir
}

func (d DirWithFallback) Open(name string) (http.File, error) {
	file, err := d.Dir.Open(name)
	if err == nil {
		return file, nil
	}

	if !errors.Is(err, fs.ErrNotExist) {
		return nil, err
	}

	return d.Dir.Open("index.html")
}
