import { _decorator, Component, Label } from 'cc';
import { Room } from '../Room';
import { CarouselScroll } from './CarouselScroll';
import { RoomButton } from './RoomButton';
const { ccclass, property } = _decorator;

@ccclass('RoomSelectorView')
export class RoomSelectorView extends Component {
    public OnGoToRoomButtonPressed: (roomIndex: number) => void;

    @property({ type: Label, visible: true, group: 'Labels' })
    private _currentRoomLabel: Label;

    @property({ type: CarouselScroll, visible: true })
    private _roomCarousel: CarouselScroll;

    private static readonly _className: string = 'RoomSelectorView';

    public init(rooms: Room[], roomIndex: number) {
        this._roomCarousel.init(
            rooms,
            (prefab, item, itemIndex) => {
                const roomButton = prefab.getComponent(RoomButton);
                roomButton.select();
                this._onGoToRoomButtonPressedCallback(itemIndex);
            },
            (prefab, item, itemIndex) => {
                const roomButton = prefab.getComponent(RoomButton);
                roomButton.deselect();
            },
            (prefab, item, itemIndex) => {
                const room = item as Room;
                prefab.name = room.RoomName;
                var roomButton = prefab.getComponent(RoomButton);
                roomButton.init(room.RoomIconSpriteFrame, !room.isUnlocked());

                roomButton.OnRoomButtonPressed = async () => {
                    const index = itemIndex;
                    this._onGoToRoomButtonPressedCallback(index);
                    roomButton.select();
                    await this._roomCarousel.scrollToItem(index);
                };
            }
        );

        this._roomCarousel.scrollToItem(roomIndex);
    }

    public setEnabled(enabled: boolean) {
        this._roomCarousel.node.active = enabled;
    }

    public setCurrentRoomTitle(title: string) {
        this._currentRoomLabel.string = title;
    }

    private _onGoToRoomButtonPressedCallback(roomIndex: number) {
        this.OnGoToRoomButtonPressed?.call(this, roomIndex);
    }
}
