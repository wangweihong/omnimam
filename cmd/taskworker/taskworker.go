package main

import "github.com/wangweihong/omnimam/internal/apiserver"

func main() {
	apiserver.NewWorkerApp("taskworker").Run()
}
