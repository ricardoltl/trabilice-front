import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

export interface TutorialStep {
  title: string;
  text: string;
  target?: string; // valor de data-tutorial-id do elemento a destacar
}

export const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  "teacher-dashboard": [
    {
      title: "Bem-vindo ao Trabilice! 👋",
      text: "Eu sou a Alice, sua assistente! Deixa eu te mostrar como a plataforma funciona. Você pode pular a qualquer momento.",
    },
    {
      title: "Suas Turmas 📚",
      text: "Aqui ficam suas turmas. Cada card representa uma turma que você leciona. Clique em uma turma para gerenciá-la.",
      target: "classroom-list",
    },
    {
      title: "Criar Nova Turma ✨",
      text: "Use o botão '+ Nova Turma' para criar uma nova turma. Um código único de 6 caracteres será gerado para os alunos entrarem!",
      target: "btn-nova-turma",
    },
  ],
  "teacher-classroom": [
    {
      title: "Código da Turma 🔑",
      text: "Este é o código da turma. Alunos já cadastrados podem usá-lo para entrar. Compartilhe com seus alunos!",
      target: "classroom-code",
    },
    {
      title: "Atividades e Alunos",
      text: "Use as abas para alternar entre as Atividades e os Alunos desta turma.",
      target: "classroom-tabs",
    },
    {
      title: "Criar Atividade 📝",
      text: "Clique em '+ Criar Atividade' para criar uma nova atividade. Você pode usar IA para gerar as questões automaticamente!",
      target: "btn-criar-atividade",
    },
    {
      title: "Adicionar Alunos 👥",
      text: "Na aba Alunos, gere um link de convite para adicionar novos alunos à turma. Cada link é válido para um aluno.",
    },
  ],
  "teacher-create-activity": [
    {
      title: "Criando uma Atividade 📝",
      text: "Preencha o título e descreva o tema da atividade. Quanto mais detalhada a descrição, melhores serão as questões geradas!",
      target: "activity-form",
    },
    {
      title: "Geração por IA ✨",
      text: "Escolha o tipo e a quantidade de questões, depois clique em 'Gerar com IA'. Vou usar inteligência artificial para criar questões relevantes para o seu tema!",
      target: "ai-generate-section",
    },
    {
      title: "Revisando e Publicando 🚀",
      text: "Revise as questões geradas, edite se necessário e clique em 'Publicar' para que os alunos possam responder. Atividades não publicadas ficam como rascunho.",
    },
  ],
  "student-dashboard": [
    {
      title: "Olá! Bem-vindo! 🌟",
      text: "Eu sou a Alice, sua assistente! Aqui você encontra todas as suas atividades pendentes e já realizadas.",
    },
    {
      title: "Suas Atividades 📋",
      text: "Cada card é uma atividade publicada pelo seu professor. Clique no card para começar a responder!",
      target: "activity-list",
    },
    {
      title: "Status das Atividades",
      text: "O badge azul 'Pendente' indica atividades não realizadas. O badge verde 'Feita' indica que você já respondeu e pode ver o resultado.",
      target: "activity-list",
    },
    {
      title: "Entrar em Nova Turma 🏫",
      text: "Clique em '+ Entrar em turma' e insira o código de 6 caracteres que o professor compartilhou com você.",
      target: "btn-entrar-turma",
    },
  ],
  "student-activity": [
    {
      title: "Hora de Responder! 📝",
      text: "Leia cada questão com calma. Para múltipla escolha, selecione a opção correta. Para dissertativas, escreva sua resposta no campo de texto.",
      target: "question-card",
    },
    {
      title: "Navegando pelas Questões",
      text: "Use os botões 'Anterior' e 'Próxima' para navegar entre as questões. Você pode voltar e alterar suas respostas a qualquer momento!",
      target: "question-nav",
    },
    {
      title: "Enviando Respostas 🎯",
      text: "Quando terminar, clique em 'Enviar Respostas'. Você verá seu resultado imediatamente após o envio!",
      target: "btn-submit",
    },
  ],
};

interface TutorialContextData {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  currentPageKey: string;
  startTutorial: (pageKey: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  hasSeenTutorial: (pageKey: string) => boolean;
}

const TutorialContext = createContext<TutorialContextData>({} as TutorialContextData);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentPageKey, setCurrentPageKey] = useState("");

  // Aplica/remove o highlight no elemento alvo
  useEffect(() => {
    const prevHighlighted = document.querySelector("[data-tutorial-highlighted]");
    if (prevHighlighted) {
      prevHighlighted.classList.remove("tutorial-highlight");
      prevHighlighted.removeAttribute("data-tutorial-highlighted");
    }

    if (!isActive || !steps[currentStep]?.target) return;

    const target = document.querySelector(`[data-tutorial-id="${steps[currentStep].target}"]`);
    if (target) {
      target.classList.add("tutorial-highlight");
      target.setAttribute("data-tutorial-highlighted", "true");
    }

    return () => {
      const highlighted = document.querySelector("[data-tutorial-highlighted]");
      if (highlighted) {
        highlighted.classList.remove("tutorial-highlight");
        highlighted.removeAttribute("data-tutorial-highlighted");
      }
    };
  }, [isActive, currentStep, steps]);

  function hasSeenTutorial(pageKey: string): boolean {
    return localStorage.getItem(`tutorial_seen_${pageKey}`) === "true";
  }

  const startTutorial = useCallback((pageKey: string) => {
    const pageSteps = TUTORIAL_STEPS[pageKey];
    if (!pageSteps || pageSteps.length === 0) return;
    setSteps(pageSteps);
    setCurrentStep(0);
    setCurrentPageKey(pageKey);
    setIsActive(true);
    localStorage.setItem(`tutorial_seen_${pageKey}`, "true");
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        setIsActive(false);
        return 0;
      }
      return next;
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  return (
    <TutorialContext.Provider
      value={{ isActive, currentStep, steps, currentPageKey, startTutorial, nextStep, prevStep, skipTutorial, hasSeenTutorial }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => useContext(TutorialContext);
