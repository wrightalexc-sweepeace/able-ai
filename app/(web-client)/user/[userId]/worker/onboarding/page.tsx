/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";

import pageStyles from "./OnboardWorkerPage.module.css";
import baseInitialSteps from "./initialSteps";
import { OnboardingStep } from "./OnboardingSteps";

import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";

import { useAuth } from "@/context/AuthContext";
import { setLastRoleUsed } from "@/lib/last-role-used";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import InputBubble from "@/app/components/onboarding/InputBubble";
import TextAreaBubble from "@/app/components/onboarding/TextAreaBubble";

export default function OnboardWorkerPage() {
  const { user, loading: loadingAuth } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>(
    baseInitialSteps.map((s) => ({ ...s, isComplete: false }))
  );
  const [formData, setFormData] = useState<
    Record<string, string | number | Date | File | null>
  >({});
  const [chatMessages, setChatMessages] = useState<OnboardingStep[]>([]);

  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<
    string | null
  >(null);

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [isViewQA, setIsViewQA] = useState(false);

  useEffect(() => {
    if (user?.claims.role === "QA") {
      setIsViewQA(true);
      const qaFormData: Record<string, string | number | Date | File | null> =
        {};
      baseInitialSteps.forEach((step) => {
        if (step.inputConfig?.name) {
          switch (step.inputConfig.type) {
            case "file":
              qaFormData[
                step.inputConfig.name
              ] = `sample-${step.inputConfig.name}.pdf`;
              break;
            case "date":
              qaFormData[step.inputConfig.name] = new Date()
                .toISOString()
                .split("T")[0];
              break;
            default:
              qaFormData[step.inputConfig.name] = `QA: ${
                step.inputConfig.label || step.inputConfig.name || "Sample"
              }`;
          }
        }
      });
      setFormData(qaFormData);
    } else {
      setIsViewQA(false);
      setOnboardingSteps(
        baseInitialSteps.map((s) => ({ ...s, isComplete: false }))
      );
      setFormData({});
    }
    setLastRoleUsed("GIG_WORKER");
  }, [user?.claims.role]);

  useEffect(() => {
    const newMessages: OnboardingStep[] = [];
    if (isViewQA) {
      let currentStepIdForDependency = 0;
      baseInitialSteps.forEach((step) => {
        const messageToAdd = {
          ...step,
          content: step.content,
          isComplete: true,
          dependsOn: currentStepIdForDependency,
        };
        newMessages.push(messageToAdd);
        currentStepIdForDependency = step.id;

        if (
          step.inputConfig?.name &&
          (step.type === "userInput" ||
            step.type === "fileUpload" ||
            step.type === "datePicker" ||
            step.type === "recordVideo")
        ) {
          let qaValue = formData[step.inputConfig.name];
          if (qaValue === undefined) {
            switch (step.inputConfig.type) {
              case "file":
                qaValue = `sample-${step.inputConfig.name}.pdf`;
                break;
              case "date":
                qaValue = new Date().toISOString().split("T")[0];
                break;
              default:
                qaValue = `QA: ${
                  step.inputConfig.label ||
                  step.inputConfig.name ||
                  "Sample Answer"
                }`;
            }
          }
          newMessages.push({
            id: step.id + 0.5,
            type: "userResponseDisplay",
            senderType: "user",
            content: String(qaValue),
            isComplete: true,
            dependsOn: currentStepIdForDependency,
          });
          currentStepIdForDependency = step.id + 0.5;
        }
      });
    } else {
      let firstUncompletedInputFound = false;
      let nextFocusTargetSet = false;
      for (let i = 0; i < onboardingSteps.length; i++) {
        const step = onboardingSteps[i];
        if (step.dependsOn) {
          const dependentStep = onboardingSteps.find(
            (s) => s.id === step.dependsOn
          );
          if (dependentStep && !dependentStep.isComplete) {
            break;
          }
        }
        newMessages.push({
          ...step,
          value: formData[step.inputConfig?.name || ""],
        });

        if (
          (step.type === "userInput" ||
            step.type === "fileUpload" ||
            step.type === "datePicker" ||
            step.type === "recordVideo") &&
          !step.isComplete &&
          !firstUncompletedInputFound
        ) {
          firstUncompletedInputFound = true;
          if (!currentFocusedInputName && !nextFocusTargetSet) {
            setCurrentFocusedInputName(step.inputConfig?.name || null);
            nextFocusTargetSet = true;
          }
        }
        if (
          (step.type === "userInput" ||
            step.type === "fileUpload" ||
            step.type === "datePicker" ||
            step.type === "recordVideo") &&
          !step.isComplete
        ) {
          break;
        }
      }
    }
    setChatMessages(newMessages);
  }, [onboardingSteps, isViewQA, formData, currentFocusedInputName]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    if (!isViewQA && currentFocusedInputName) {
      const inputElement = document.querySelector(
        `[name="${currentFocusedInputName}"]`
      ) as HTMLElement;
      inputElement?.focus();
    }
  }, [chatMessages, currentFocusedInputName, isViewQA]);

  const handleInputChange = (
    name: string,
    value: string | number | Date | File | null
  ) => {
    if (isViewQA) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputSubmit = (stepId: number, inputName: string) => {
    if (isViewQA) return;
    if (formData[inputName] === undefined || formData[inputName] === "") return;

    const stepIndex = onboardingSteps.findIndex((s) => s.id === stepId);
    if (stepIndex !== -1 && !onboardingSteps[stepIndex].isComplete) {
      const updatedSteps = [...onboardingSteps];
      updatedSteps[stepIndex].isComplete = true;
      setOnboardingSteps(updatedSteps);
    }

    let nextFocus: string | null = null;
    const currentStepInFlowIndex = onboardingSteps.findIndex(
      (s) => s.id === stepId
    );
    for (let i = currentStepInFlowIndex + 1; i < onboardingSteps.length; i++) {
      const nextStepDef = onboardingSteps[i];
      if (
        (nextStepDef.type === "userInput" ||
          nextStepDef.type === "fileUpload" ||
          nextStepDef.type === "datePicker" ||
          nextStepDef.type === "recordVideo") &&
        !nextStepDef.isComplete
      ) {
        const depStep = onboardingSteps.find(
          (s) => s.id === nextStepDef.dependsOn
        );
        if ((depStep && depStep.isComplete) || !nextStepDef.dependsOn) {
          nextFocus = nextStepDef.inputConfig?.name || null;
          break;
        }
      }
    }
    setCurrentFocusedInputName(nextFocus);
  };

  const handleVideoUpload = async (
    file: File,
    name?: string,
    stepId?: number
  ) => {
    if (!user || !name || stepId === undefined) return;

    const filePath = `users/${user.uid}/onboarding-videos/${file.name}`;
    const fileStorageRef = storageRef(getStorage(firebaseApp), filePath);
    const uploadTask = uploadBytesResumable(fileStorageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress((prev) => ({ ...prev, [name]: progress }));
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploadProgress((prev) => ({ ...prev, [name]: -1 })); // Indicate error
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUploadProgress((prev) => ({ ...prev, [name]: 100 })); // Indicate completion
          handleInputChange(name, downloadURL);
          handleInputSubmit(stepId, name);
        });
      }
    );
  };

  const handleCalendarChange = (
    date: Date | null,
    stepId: number,
    name: string
  ) => {
    if (date) {
      handleInputChange(name, date);
      handleInputSubmit(stepId, name);
    }
  };

  if (loadingAuth) {
    return (
      <div className={pageStyles.loadingContainer}>
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <ChatBotLayout ref={chatContainerRef} onScroll={() => {}}>
      {chatMessages.map((step) => {
        const key = `step-${step.id}-${step.senderType || step.type}-${
          step.inputConfig?.name || Math.random()
        }`;

        if (step.type === "botMessage") {
          return (
            <MessageBubble
              key={key}
              text={step.content as string}
              senderType="bot"
            />
          );
        }
        if (step.type === "userResponseDisplay") {
          return (
            <MessageBubble
              key={key}
              text={step.content as string}
              senderType="user"
              showAvatar={false}
            />
          );
        }

        if (
          !isViewQA &&
          step.inputConfig &&
          (step.type === "userInput" ||
            step.type === "fileUpload" ||
            step.type === "datePicker" ||
            step.type === "recordVideo") &&
          !step.isComplete
        ) {
          const inputConfig = step.inputConfig;
          const rawValue = formData[inputConfig.name] || "";
          const commonProps = {
            id: inputConfig.name,
            name: inputConfig.name,
            label: inputConfig.label,
            disabled: false,
            onFocus: () => setCurrentFocusedInputName(inputConfig.name || null),
            onBlur: () => {
              if (formData[inputConfig.name]) {
                handleInputSubmit(step.id, inputConfig.name);
              }
            },
            onKeyPress: (
              e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleInputSubmit(step.id, inputConfig.name);
              }
            },
          };

          if (inputConfig.type === "textarea") {
            const value = typeof rawValue === "string" ? rawValue : "";
            return (
              <TextAreaBubble
                key={key}
                {...commonProps}
                value={value}
                placeholder={inputConfig.placeholder}
                rows={3}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange(inputConfig.name, e.target.value)
                }
                ref={(el: HTMLTextAreaElement | null) => {
                  if (el && currentFocusedInputName === inputConfig.name)
                    el.focus();
                }}
              />
            );
          }
          if (
            inputConfig.type === "text" ||
            inputConfig.type === "email" ||
            inputConfig.type === "number"
          ) {
            const value =
              typeof rawValue === "string" || typeof rawValue === "number"
                ? rawValue
                : "";
            return (
              <InputBubble
                key={key}
                {...commonProps}
                value={value}
                type={inputConfig.type}
                placeholder={inputConfig.placeholder}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(inputConfig.name, e.target.value)
                }
                ref={(el: HTMLInputElement | null) => {
                  if (el && currentFocusedInputName === inputConfig.name)
                    el.focus();
                }}
              />
            );
          }
          if (step.type === "datePicker") {
            return (
              <CalendarPickerBubble
                onChange={(date) =>
                  handleCalendarChange(date, step.id, inputConfig.name)
                }
                key={key}
              />
            );
          }
          if (step.type === "recordVideo") {
            return (
              <VideoRecorderBubble key={key} />
            );
          }
        }
        return null;
      })}
      <VideoRecorderBubble
      />
    </ChatBotLayout>
  );
}
