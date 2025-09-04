import { _decorator, Component, JsonAsset } from "cc";

const { ccclass, property } = _decorator;

@ccclass("SoundData")
export class SoundData extends JsonAsset {
	@property
	public soundName: string = "";

	@property
	public clip: string = "";

	@property
	public volume: number = 1;

	@property
	public playOnAwake: boolean = false;

	@property
	public frequentSound: boolean = false;

	// TODO: Figure out if Cocos can do pitch shifting somehow
	// @property
	// randomPitch: boolean = false;

	// @property
	// public pitchMin: number = 0.9;

	// @property
	// public pitchMax: number = 1.1;

	@property
	public loop: boolean = false;

	@property
	public fadeOut: boolean = false;

	@property
	public fadeOutTimeSeconds: number = 0;

	@property
	public fadeIn: boolean = false;

	@property
	public fadeInTimeSeconds: number = 0;
}
