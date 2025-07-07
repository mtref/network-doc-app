// /frontend/src/components/ConnectionForm.js
import React, { memo } from "react";
import { useConnectionFormState } from "./connection/useConnectionFormState";
import { PCStep } from "./connection/PCStep";
import { ConnectionDetailsStep } from "./connection/ConnectionDetailsStep";

const ConnectionForm = memo(function ConnectionForm(props) {
  const { state, setters, handlers, refs } = useConnectionFormState(props);

  return (
    <div className="space-y-8">
      {state.currentStep === 1 && (
        <PCStep
          formState={state}
          formSetters={setters}
          handlers={{
            onAddEntity: props.onAddEntity,
            showMessage: props.showMessage,
          }}
          refs={refs}
        />
      )}

      {state.currentStep === 2 && (
        <ConnectionDetailsStep
          formState={state}
          formSetters={setters}
          handlers={handlers}
          onAddEntity={props.onAddEntity}
          onShowPortStatus={props.onShowPortStatus}
        />
      )}
    </div>
  );
});

export default ConnectionForm;
