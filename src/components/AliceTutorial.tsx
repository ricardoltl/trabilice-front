import { useEffect } from "react";
import { useMatch } from "react-router-dom";
import { useTutorial, TUTORIAL_STEPS } from "../contexts/TutorialContext";
import aliceHelperImg from "../assets/aliceHelper.webp";

// Mapeamento de rota → chave de tutorial
function useCurrentTutorialKey(): string | null {
  const isTeacherDashboard = useMatch("/teacher");
  const isClassroomView = useMatch("/teacher/classroom/:id");
  const isCreateActivity = useMatch("/teacher/classroom/:classroomId/new-activity");
  const isStudentDashboard = useMatch("/student");
  const isStudentActivity = useMatch("/student/activity/:id");

  if (isTeacherDashboard) return "teacher-dashboard";
  if (isCreateActivity) return "teacher-create-activity";
  if (isClassroomView) return "teacher-classroom";
  if (isStudentDashboard) return "student-dashboard";
  if (isStudentActivity) return "student-activity";

  return null;
}

export default function AliceTutorial() {
  const { isActive, currentStep, steps, startTutorial, nextStep, prevStep, skipTutorial } = useTutorial();
  const tutorialKey = useCurrentTutorialKey();

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const hasTutorialForPage = tutorialKey !== null && TUTORIAL_STEPS[tutorialKey] !== undefined;

  if (!hasTutorialForPage) return null;

  return (
    <>
      {/* Overlay semi-transparente quando o tutorial está ativo */}
      {isActive && <div className="alice-overlay" onClick={skipTutorial} />}

      {/* Botão flutuante de ajuda (quando inativo) */}
      {!isActive && (
        <button
          className="alice-help-btn"
          onClick={() => startTutorial(tutorialKey!)}
          title="Precisa de ajuda? Clique aqui!"
          aria-label="Ajuda com Alice"
        >
          <img src={aliceHelperImg} alt="Alice" className="alice-help-avatar" />
        </button>
      )}

      {/* Tutorial ativo */}
      {isActive && step && (
        <div className="alice-tutorial-container" onClick={(e) => e.stopPropagation()}>
          {/* Balão de fala */}
          <div className="alice-bubble">
            <div className="alice-bubble-header">
              <span className="alice-bubble-title">{step.title}</span>
              <button className="alice-close-btn" onClick={skipTutorial} aria-label="Fechar tutorial">✕</button>
            </div>

            <p className="alice-bubble-text">{step.text}</p>

            <div className="alice-bubble-footer">
              <div className="alice-step-dots">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`alice-dot ${i === currentStep ? "alice-dot-active" : ""}`}
                  />
                ))}
              </div>

              <div className="alice-nav-btns">
                {currentStep > 0 && (
                  <button className="alice-btn alice-btn-secondary" onClick={prevStep}>
                    ← Anterior
                  </button>
                )}
                {isLastStep ? (
                  <button className="alice-btn alice-btn-primary" onClick={skipTutorial}>
                    Entendi! 🎉
                  </button>
                ) : (
                  <button className="alice-btn alice-btn-primary" onClick={nextStep}>
                    Próximo →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mascote Alice */}
          <div className="alice-mascot-wrapper">
            <img
              src={aliceHelperImg}
              alt="Alice"
              className="alice-mascot-img"
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Hook para auto-iniciar o tutorial na primeira visita a uma página.
 * Adicione em cada página: useTutorialAutoStart("page-key")
 */
export function useTutorialAutoStart(pageKey: string) {
  const { startTutorial, hasSeenTutorial } = useTutorial();

  useEffect(() => {
    // Pequeno delay para garantir que os elementos já estão no DOM
    const timer = setTimeout(() => {
      if (!hasSeenTutorial(pageKey)) {
        startTutorial(pageKey);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
