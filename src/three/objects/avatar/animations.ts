import { avatar } from ".";
import { avatarHologram } from "./hologram";
import { AnimationAction, AnimationMixer, LoopOnce, LoopPingPong } from "three";
import gsap from "gsap";
import { resources } from "../../../utils/resources";
import { sceneWeights } from "../../../animations/scenes";
import { face } from "./face";
import { sleepingSprite } from "../contact/sleeping-sprite";
import { playSound } from "../../../features/sounds/utils/sounds";
import { stopSnoreRepetition } from "../../../features/sounds/core/contact";

import type { AnimationClip, Object3D } from "three";

let mixer: AnimationMixer;
let activeAction: string | null = null;
const actions = new Map<string, AnimationAction>();
let isAwake = false;
const wavingStrength = { value: 0 };
let hologramMixer: AnimationMixer | null = null;
const hologramActions = new Map<string, AnimationAction>();

const init = () => {
  const mesh = avatar.getMesh();
  if (mesh) {
    mixer = new AnimationMixer(mesh as Object3D);
  }
  
  const hologramMesh = avatarHologram?.getMesh();
  if (hologramMesh) {
    hologramMixer = new AnimationMixer(hologramMesh as Object3D);
  }

  setupActions();
  setupHologramActions();

  play("desktop-idle");

  wave();
};

const getActionFromMesh = (name: string) => {
  const resource = resources.items["avatar-model"];
  const action = resource.animations?.find((animation: AnimationClip) => animation.name === name);
  return action || null;
};


const setupActions = () => {
  if (!mixer) return;
  // The new model might not have these animations, fail gracefully
  
  const desktopIdleClip = getActionFromMesh("idle");
  if (desktopIdleClip) {
    const desktopIdle = mixer.clipAction(desktopIdleClip);
    desktopIdle.loop = LoopPingPong;
    actions.set("desktop-idle", desktopIdle);
    desktopIdle.weight = 1;
  }

  const tIdleClip = getActionFromMesh("t-idle");
  if (tIdleClip) {
    const tIdle = mixer.clipAction(tIdleClip);
    tIdle.loop = LoopPingPong;
    actions.set("t-idle", tIdle);
    tIdle.weight = 0;
    tIdle.play();
  }

  const leftDesktopClip = getActionFromMesh("left-desktop");
  if (leftDesktopClip) {
    const leftDesktop = mixer.clipAction(leftDesktopClip);
    leftDesktop.repetitions = 1;
    leftDesktop.clampWhenFinished = true;
    actions.set("left-desktop", leftDesktop);
    leftDesktop.weight = 0;
  }

  const sleepingClip = getActionFromMesh("sleeping");
  if (sleepingClip) {
    const sleeping = mixer.clipAction(sleepingClip);
    sleeping.loop = LoopPingPong;
    actions.set("sleeping", sleeping);
    sleeping.weight = 1;
    sleeping.play();
  }

  const wakeClip = getActionFromMesh("wake-up");
  if (wakeClip) {
    const wake = mixer.clipAction(wakeClip);
    wake.repetitions = 1;
    wake.clampWhenFinished = true;
    actions.set("wake-up", wake);
  }

  const contactIdleClip = getActionFromMesh("contact-idle");
  if (contactIdleClip) {
    const contactIdle = mixer.clipAction(contactIdleClip);
    contactIdle.loop = LoopPingPong;
    actions.set("contact-idle", contactIdle);
  }

  const waveClip = getActionFromMesh("wave");
  if (waveClip) {
    const wave = mixer.clipAction(waveClip);
    wave.clampWhenFinished = true;
    wave.loop = LoopOnce;
    actions.set("wave", wave);
  }
};

const setupHologramActions = () => {
  if (!hologramMixer) return;
  
  const desktopIdleClip = getActionFromMesh("idle");
  if (desktopIdleClip) {
    const desktopIdle = hologramMixer.clipAction(desktopIdleClip);
    desktopIdle.loop = LoopPingPong;
    hologramActions.set("desktop-idle", desktopIdle);
    desktopIdle.weight = 1;
    desktopIdle.play();
  }

  const tIdleClip = getActionFromMesh("t-idle");
  if (tIdleClip) {
    const tIdle = hologramMixer.clipAction(tIdleClip);
    tIdle.loop = LoopPingPong;
    hologramActions.set("t-idle", tIdle);
    tIdle.weight = 0;
    tIdle.play();
  }

  const leftDesktopClip = getActionFromMesh("left-desktop");
  if (leftDesktopClip) {
    const leftDesktop = hologramMixer.clipAction(leftDesktopClip);
    leftDesktop.repetitions = 1;
    leftDesktop.clampWhenFinished = true;
    hologramActions.set("left-desktop", leftDesktop);
    leftDesktop.weight = 0;
  }

  const waveClip = getActionFromMesh("wave");
  if (waveClip) {
    const wave = hologramMixer.clipAction(waveClip);
    wave.clampWhenFinished = true;
    wave.loop = LoopOnce;
    hologramActions.set("wave", wave);
  }
};

const play = (name: string, transition: number = 0.5) => {
  if (activeAction === name) return;
  const newAction = actions.get(name);
  const newHologramAction = hologramActions.get(name);
  // Fail gracefully if animations are missing
  if (newAction) {
    newAction.reset().play();
  }
  if (newHologramAction) {
    newHologramAction.reset().play();
  }

  if (activeAction) {
    const currentAction = actions.get(activeAction);
    if (currentAction && newAction) currentAction.crossFadeTo(newAction, transition);

    const currentHologramAction = hologramActions.get(activeAction);
    if (currentHologramAction && newHologramAction) currentHologramAction.crossFadeTo(newHologramAction, transition);
  }

  activeAction = name;
};

const setWeight = (key: string, weight: number) => {
  const action = actions.get(key);
  if (action) action.weight = weight;
  const hologramAction = hologramActions.get(key);
  if (hologramAction) hologramAction.weight = weight;
};

const updateIntro = () => {
  setWeight("desktop-idle", (1 - avatar.tIdleIntensity.value) * (1 - wavingStrength.value));
  setWeight("left-desktop", (1 - avatar.tIdleIntensity.value) * (1 - wavingStrength.value));
  setWeight("t-idle", avatar.tIdleIntensity.value);
  setWeight("sleeping", 0);
  setWeight("contact-idle", 0);
  setWeight("wake-up", 0);
  setWeight("wave", wavingStrength.value * (1 - avatar.tIdleIntensity.value));
};

const wave = () => {
  const waveAction = actions.get("wave");
  const hologramWaveAction = hologramActions.get("wave");
  if (!waveAction) return;
  const tl = gsap.timeline();

  const waveDuration = waveAction.getClip().duration;
  waveAction.play();
  hologramWaveAction?.play();

  // Try to use face if it's there
  if (face && face.wave) {
    tl.add(face.wave());
  }
  tl.fromTo(wavingStrength, { value: 1 }, { value: 0 }, waveDuration - 0.2);

  return tl;
};

const wakeUp = () => {
  if (isAwake) return;
  isAwake = true;
  const sleepingAction = actions.get("sleeping");
  const wakeUpAction = actions.get("wake-up");
  const contactIdleAction = actions.get("contact-idle");
  if (!sleepingAction || !wakeUpAction || !contactIdleAction) return;

  stopSnoreRepetition();
  playSound("gasp");

  //crossfade to wake-up
  sleepingAction.crossFadeTo(wakeUpAction, 0.2);
  wakeUpAction.play();

  const wakeUpDuration = wakeUpAction.getClip().duration;

  setTimeout(() => {
    //crossfade to contact-idle
    wakeUpAction.crossFadeTo(contactIdleAction, 0.5);
    contactIdleAction.play();
  }, wakeUpDuration * 1000);

  if (face && face.wakeUp) {
    face.wakeUp();
  }
  if (sleepingSprite && sleepingSprite.hide) {
    sleepingSprite.hide();
  }
};

const updateContact = () => {
  setWeight("desktop-idle", 0);
  setWeight("left-desktop", 0);
  setWeight("t-idle", 0);
  setWeight("sleeping", 1);
  setWeight("contact-idle", 1);
  setWeight("wake-up", 1);
  setWeight("wave", 0);
};

const update = () => {
  const isContact = sceneWeights.contact > 0.001;
  if (isContact) {
    updateContact();
  } else {
    updateIntro();
  }

  const delta = gsap.ticker.deltaRatio(60);
  if (mixer) mixer.update(delta / 60);
  if (hologramMixer) hologramMixer.update(delta / 60);
};

export const animations = { init, play, actions, update, wakeUp, getIsAwake: () => isAwake, wave };
