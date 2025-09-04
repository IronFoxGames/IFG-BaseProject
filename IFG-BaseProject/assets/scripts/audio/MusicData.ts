import { _decorator, Component, JsonAsset } from "cc";

const { ccclass, property } = _decorator;

@ccclass("MusicData")
export class MusicData extends JsonAsset {
	@property
	public musicName: string = "";

	@property
	public clip: string = "";

	@property
	public volume: number = 1;

	@property
	public playOnAwake: boolean = true;

	// TODO: Figure out if Cocos can do pitch shifting somehow
	// @property
	// randomPitch: boolean = false;

	// @property
	// public pitchMin: number = 0.9;

	// @property
	// public pitchMax: number = 1.1;

	@property
	public loop: boolean = true;

	@property
	public fadeOutTimeSeconds: number = 0;

	@property
	public fadeInTimeSeconds: number = 0;
}
