package callstatus

import (
	"github.com/wangweihong/gotoolbox/pkg/errors"
)

// ToError convert grpc call status to err.
func ToError(cs *CallStatus) *errors.Status {
	if cs == nil || cs.Code == 0 {
		return errors.ToStatus(nil)
	}

	// TODO: fixme
	return &errors.Status{
		// HTTPStatus: ,
		Code:    int(cs.Code),
		Message: cs.Message,
		Desc:    cs.Description,
		// Cause:      ,
	}
}

// FromError convert err to grpc call status.
func FromError(err error) *CallStatus {
	//e := errors.FromError(err)
	//if e == nil {
	//	e = errors.Wrap(code.ErrSuccess, "")
	//}
	//
	//cs := &CallStatus{
	//	Code:        int64(e.Code()),
	//	Message:     e.Message(),
	//	Stack:       e.Stack(),
	//	Description: e.Description(),
	//}
	//
	//if errors.IsCode(e, code.ErrSuccess) {
	//	cs.Stack = nil
	//}
	//
	//return cs
	return nil
}
