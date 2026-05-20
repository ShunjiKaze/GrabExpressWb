import { CheckIcon } from './Icons';

function StepBar({ steps, currentStep }) {
  return (
    <div className="step-bar">
      {steps.map((label, i) => {
        const status = i < currentStep ? 'completed' : i === currentStep ? 'active' : '';
        return (
          <div key={i} className={`step-item ${status}`}>
            <div className="step-circle">
              {i < currentStep ? <CheckIcon size={13} color="currentColor" strokeWidth={2.5} /> : i + 1}
            </div>
            <span className="step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default StepBar;
