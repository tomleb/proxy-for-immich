package main

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
)

func Trace(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		slog.Debug("Received request", "path", req.URL.Path, "query", req.URL.RawQuery)
		next.ServeHTTP(w, req)
	})
}

func FilterOpenAPIPaths(next http.Handler, doc *openapi3.T) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		trimmedPath := strings.TrimPrefix(req.URL.Path, "/api")
		pathItem := findMatchingPath(doc, trimmedPath)

		if pathItem == nil {
			slog.Info("skipping path", "path", req.URL.Path)
			http.NotFound(w, req)
			return
		}

		operation := pathItem.GetOperation(req.Method)
		if operation == nil {
			slog.Info("skipping operation", "path", req.URL.Path, "op", req.Method)
			// TODO: Generate Allow header
			http.Error(w, "Not allowed", http.StatusMethodNotAllowed)
			return
		}

		next.ServeHTTP(w, req)
	})
}

func findMatchingPath(doc *openapi3.T, urlPath string) *openapi3.PathItem {
	urlFields := strings.Split(urlPath, "/")

	paths := doc.Paths.InMatchingOrder()
	for _, path := range paths {
		pathFields := strings.Split(path, "/")
		if isPathMatch(pathFields, urlFields) {
			return doc.Paths.Value(path)
		}
	}

	return nil
}

func isPathMatch(pathFields []string, urlFields []string) bool {
	if len(urlFields) != len(pathFields) {
		return false
	}

	for i, pathField := range pathFields {
		if strings.HasPrefix(pathField, "{") && strings.HasSuffix(pathField, "}") {
			continue
		}

		if pathField != urlFields[i] {
			return false
		}
	}

	return true
}
