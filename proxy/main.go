package main

import (
	"flag"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/getkin/kin-openapi/openapi3"
)

var (
	openAPISpecFile string
	listenAddr      string
	upstream        string
	host            string
	webDir          string
	debug           bool
)

func main() {
	flag.StringVar(&openAPISpecFile, "openapi-spec-file", "", "Path to OpenAPI specification file")
	flag.StringVar(&listenAddr, "listen-addr", ":8080", "Listen address for the HTTP server")
	flag.StringVar(&upstream, "upstream", "", "Upstream server URL")
	flag.StringVar(&host, "host", "", "Host header value")
	flag.StringVar(&webDir, "web-dir", "", "Directory to immich web")
	flag.BoolVar(&debug, "debug", false, "Enable debug logging")
	flag.Parse()

	if host == "" || openAPISpecFile == "" || upstream == "" || webDir == "" {
		flag.Usage()
		os.Exit(1)
	}

	if debug {
		slog.SetLogLoggerLevel(slog.LevelDebug.Level())
	}

	if err := mainErr(); err != nil {
		log.Fatal(err)
	}
}

func mainErr() error {
	loader := openapi3.NewLoader()
	doc, err := loader.LoadFromFile(openAPISpecFile)
	if err != nil {
		return fmt.Errorf("loading spec: %w", err)
	}

	apiReverseProxy, err := NewAPIReverseProxy(upstream, host)
	if err != nil {
		return fmt.Errorf("creating api reverseproxy: %w", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/api/*", Trace(FilterOpenAPIPaths(apiReverseProxy, doc)))
	mux.Handle("/*", Trace(FileServerWithFallback(webDir)))

	server := &http.Server{
		Addr:    listenAddr,
		Handler: mux,
	}

	slog.Info("Listening", "addr", server.Addr)
	err = server.ListenAndServe()
	if err != nil {
		return fmt.Errorf("serve: %w", err)
	}

	return nil
}
