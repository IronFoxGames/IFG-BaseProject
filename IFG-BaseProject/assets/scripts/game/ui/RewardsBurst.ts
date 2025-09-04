import { Vec3 } from 'cc';
import { Tween } from 'cc';
import { instantiate } from 'cc';
import { Prefab } from 'cc';
import { UITransform } from 'cc';
import { Vec2 } from 'cc';
import { _decorator, Node, Sprite, tween } from 'cc';
import { logger } from '../../logging';
import { Canvas } from 'cc';
const { ccclass, property } = _decorator;

export enum BurstDirection {
    Up = 'up',
    Down = 'down',
    Left = 'left',
    Right = 'right',
    Random = 'random'
}

@ccclass('BurstRewards')
export class BurstRewards {
    private _onBurstComplete: () => void = null;

    private iconPool: Node[] = [];

    // Maximum random spawn delay in seconds
    private _maximumRandomSpawnDelay: number = 0.6;

    // Minimum and maximum distance for the explosion
    private _explodeDistanceRange: Vec2 = new Vec2(10, 150);

    private _destinationNode: Node = null;
    private _spawnNode: Node = null;
    private _iconSprite: Sprite;
    private _iconPrefab: Prefab = null;
    private _canvasNode: Node = null;
    private _nodeDimensions: Vec2 = new Vec2(0, 0);
    private _amount: number = 0;
    private _direction: BurstDirection = BurstDirection.Random;

    private _nodePool: Node[] = [];
    private _completedItems: number = 0;

    private _iconTweens: Tween<Node>[] = [];
    private _iconToDestTweens: Tween<Node>[] = [];
    private _burstTimeouts: ReturnType<typeof setTimeout>[] = [];
    private _moveTimeouts: ReturnType<typeof setTimeout>[] = [];

    private _log = logger.child('BurstRewards');
    private stopped: boolean = false;

    public static createSprites(
        sprite: Sprite,
        amount: number,
        direction: BurstDirection,
        spawnNode: Node,
        dimensions: Vec2,
        destinationNode: Node,
        canvas: Node,
        onBurstComplete: () => void = null
    ): BurstRewards {
        const instance = new BurstRewards();
        instance.burstRewardsSprites(sprite, amount, direction, spawnNode, dimensions, destinationNode, canvas, onBurstComplete);
        return instance;
    }

    public static createPrefabs(
        prefab: Prefab,
        amount: number,
        direction: BurstDirection,
        spawnNode: Node,
        destinationNode: Node,
        canvas: Node,
        onBurstComplete: () => void = null
    ): BurstRewards {
        const instance = new BurstRewards();
        instance.burstRewardsPrefabs(prefab, amount, direction, spawnNode, destinationNode, canvas, onBurstComplete);
        return instance;
    }

    private burstRewardsPrefabs(
        prefab: Prefab,
        amount: number,
        direction: BurstDirection,
        spawnNode: Node,
        destinationNode: Node,
        canvas: Node,
        onBurstComplete: () => void = null
    ): void {
        const cleanedAmount = this.cleanAmount(amount);

        this._spawnNode = spawnNode;
        this._destinationNode = destinationNode;
        this._amount = cleanedAmount;
        this._direction = direction;
        this._iconPrefab = prefab;
        this._canvasNode = canvas;
        this._onBurstComplete = onBurstComplete;

        this._doPrefabExplosion();
    }

    private burstRewardsSprites(
        sprite: Sprite,
        amount: number,
        direction: BurstDirection,
        spawnNode: Node,
        dimensions: Vec2,
        destinationNode: Node,
        canvas: Node,
        onBurstComplete: () => void = null
    ): void {
        const cleanedAmount = this.cleanAmount(amount);

        this._spawnNode = spawnNode;
        this._destinationNode = destinationNode;
        this._amount = cleanedAmount;
        this._direction = direction;
        this._iconSprite = sprite;
        this._nodeDimensions = dimensions;
        this._canvasNode = canvas;
        this._onBurstComplete = onBurstComplete;

        this._doSpriteExplosion();
    }

    private cleanAmount(amount: number): number {
        // If the amount is greater than 15, clean it
        return amount <= 15 ? amount : Math.min(30, 15 + Math.floor((amount - 15) / 5));
    }

    public stop() {
        this.stopped = true;

        this._iconTweens.forEach((t) => t?.stop());
        this._iconTweens = [];

        this._iconToDestTweens.forEach((t) => t?.stop());
        this._iconToDestTweens = [];

        this._moveTimeouts.forEach((t) => clearTimeout(t));
        this._moveTimeouts = [];

        this._burstTimeouts.forEach((t) => clearTimeout(t));
        this._burstTimeouts = [];

        this._cleanup();
    }

    private _doSpriteExplosion(): void {
        for (let i = 0; i < this._amount; i++) {
            const delay = Math.random() * this._maximumRandomSpawnDelay;

            const burstTimeout = setTimeout(() => {
                if (this.stopped) return; // Stop execution if the class has been stopped

                const iconNode = new Node('RewardIcon');
                this._nodePool.push(iconNode);
                iconNode.parent = this._canvasNode;
                const spriteHolder = iconNode.addComponent(Sprite);
                iconNode.setWorldPosition(this._spawnNode.getWorldPosition());
                iconNode.getComponent(UITransform).setContentSize(this._nodeDimensions.x, this._nodeDimensions.y);

                if (spriteHolder) {
                    spriteHolder.sizeMode = Sprite.SizeMode.CUSTOM;
                    spriteHolder.spriteFrame = this._iconSprite.spriteFrame;

                    // Do the burst movement for each icon
                    const tweenIcon = this._tweenIconBurst(iconNode);
                    this._iconTweens.push(tweenIcon);

                    // Move the icon to the destination after the burst
                    const moveTimeout = setTimeout(() => {
                        if (this.stopped) return; // Stop execution if the class has been stopped

                        let iconNodePosition = new Vec3(0, 0, 0);
                        if (this._destinationNode) {
                            iconNodePosition = this._destinationNode.getWorldPosition();
                        } else {
                            this._log.warn('Destination node is null, using icon position as destination.');
                        }
                        const moveTween = this._moveIconToDestination(iconNode, iconNodePosition);
                        this._iconToDestTweens.push(moveTween);
                    }, 1000); // Wait for the burst animation to complete
                    this._moveTimeouts.push(moveTimeout);
                }
            }, delay * 1000);
            this._burstTimeouts.push(burstTimeout);
        }
    }

    private _doPrefabExplosion(): void {
        for (let i = 0; i < this._amount; i++) {
            const delay = Math.random() * this._maximumRandomSpawnDelay;

            const burstTimeout = setTimeout(() => {
                if (this.stopped) return; // Stop execution if the class has been stopped

                const iconNode = instantiate(this._iconPrefab);
                iconNode.parent = this._canvasNode;
                this._nodePool.push(iconNode);
                iconNode.setWorldPosition(this._spawnNode.getWorldPosition());

                // Do the burst movement for each icon
                const tweenIcon = this._tweenIconBurst(iconNode);
                this._iconTweens.push(tweenIcon);

                // Move the icon to the destination after the burst
                const moveTimeout = setTimeout(() => {
                    if (this.stopped) return; // Stop execution if the class has been stopped

                    let destinationPosition = new Vec3(0, 0, 0);
                    if (this._destinationNode) {
                        destinationPosition = this._destinationNode.getWorldPosition();
                    } else {
                        this._log.warn('Destination node is null, using icon position as destination.');
                    }
                    const moveTween = this._moveIconToDestination(iconNode, destinationPosition);
                    this._iconToDestTweens.push(moveTween);
                }, 1000); // Wait for the burst animation to complete
                this._moveTimeouts.push(moveTimeout);
            }, delay * 1000);
            this._burstTimeouts.push(burstTimeout);
        }
    }

    private _tweenIconBurst(icon: Node): Tween<Node> {
        if (this.stopped) return; // Stop execution if the class has been stopped
        const start = this._spawnNode.getWorldPosition();

        let baseAngle: number;
        let arcRange = Math.PI / 3; // Default arc range
        switch (this._direction) {
            case BurstDirection.Up:
                baseAngle = Math.PI / 2;
                break;
            case BurstDirection.Down:
                baseAngle = -Math.PI / 2;
                break;
            case BurstDirection.Left:
                baseAngle = Math.PI;
                break;
            case BurstDirection.Right:
                baseAngle = 0;
                break;
            case BurstDirection.Random:
                arcRange = Math.PI / 2; // Full range for random direction
                baseAngle = Math.random() * Math.PI * 2;
                break;
        }

        if (this.stopped) return; // Stop execution if the class has been stopped

        // Randomize the angle within the arc around the base direction.
        const randomOffset = (Math.random() * 2 - 1) * arcRange;
        const angle = baseAngle + randomOffset;

        // Determine the distance with some randomness.
        const distance = this._explodeDistanceRange.x + Math.random() * (this._explodeDistanceRange.y - this._explodeDistanceRange.x);

        // Compute the end position based on the calculated angle.
        const end = new Vec3(start.x + Math.cos(angle) * distance, start.y + Math.sin(angle) * distance, start.z);

        // Compute the midpoint with some vertical offset to simulate a bounce.
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2 + 150;
        const midpoint = new Vec3(midX, midY, start.z);

        return this.tweenIconWithMidpoint(icon, start, midpoint, end);
    }

    private tweenIconWithMidpoint(icon: Node, start: Vec3, midpoint: Vec3, end: Vec3): Tween<Node> {
        if (this.stopped) return; // Stop execution if the class has been stopped
        return tween(icon)
            .to(0.2, { worldPosition: midpoint }, { easing: 'circOut' }) // fly toward the midpoint
            .to(0.3, { worldPosition: end }, { easing: 'circIn' }) // settle at the end position
            .by(0.1, { worldPosition: new Vec3(0, 15, 0) }, { easing: 'circOut' }) // slight upward bounce
            .by(0.4, { worldPosition: new Vec3(0, -20, 0) }, { easing: 'circInOut' }) // settle downward
            .start();
    }

    private _moveIconToDestination(icon: Node, destinationPosition: Vec3): Tween<Node> {
        if (this.stopped) return; // Stop execution if the class has been stopped

        return tween(icon)
            .to(0.8, { worldPosition: destinationPosition }, { easing: 'quartInOut' })
            .call(() => {
                icon.destroy();
                const index = this._nodePool.indexOf(icon);
                if (index > -1) {
                    this._nodePool.splice(index, 1);
                }
                this._onItemComplete();
            })
            .start();
    }

    private _onItemComplete(): void {
        if (this.stopped) return; // Stop execution if the class has been stopped

        this._completedItems++;
        if (this._completedItems >= this._amount) {
            this._cleanup();
        }
    }

    private _cleanup(): void {
        if (this._onBurstComplete) {
            this._onBurstComplete.call(this);
        }

        // Delay cleanup slightly to allow callback propagation
        setTimeout(() => {
            this._nodePool.forEach((node) => node.destroy());
            this._nodePool = [];

            this._iconTweens = [];
            this._iconToDestTweens = [];
            this._burstTimeouts = [];
            this._moveTimeouts = [];
            this._destinationNode = null;
            this._spawnNode = null;
            this._iconSprite = null;
            this._iconPrefab = null;
            this._canvasNode = null;
            this._onBurstComplete = null;

            this._log = null;
        }, 0);
    }
}
