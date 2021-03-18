// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import { FlatList, View, StyleSheet, Image, Text } from 'react-native';
import {
    bool,
    func,
    object,
    number,
    string,
    node,
} from 'prop-types';
import {
    colors,
    fonts,
    deviceWidth,
    ios,
} from '../../constants';
import EmptyColumn from '../EmptyColumn/EmptyColumn';
import {
    ColumnWrapper,
    ParagraphWrapper,
    Paragraph,
    RowContainer,
    RowWrapper,
    SumWrapper,
} from './Column.styled';

const COLUMN_WIDTH = 0.78 * deviceWidth;
const PADDING = 32;
const ONE_COLUMN_WIDTH = deviceWidth - PADDING;

class Column extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { column, boardRepository } = this.props;

        boardRepository.addListener(column.id(), 'reload', () => this.forceUpdate());
    }

    onPressIn = (item, y) => {
        const { column, onPressIn } = this.props;
        onPressIn(column.id(), item, y);
    }

    onPress = (item) => {
        const { column, onPress } = this.props;

        return onPress(column.id(), item);
    }

    setItemRef = (item, ref) => {
        const { column, boardRepository } = this.props;
        boardRepository.setItemRef(column.id(), item, ref);
        boardRepository.updateColumnsLayoutAfterVisibilityChanged();
    }

    updateItemWithLayout = (item) => () => {
        const { column, boardRepository } = this.props;
        boardRepository.updateItemWithLayout(column.id(), item);
    }

    setColumnRef = (ref) => {
        const { column, boardRepository } = this.props;
        boardRepository.setColumnRef(column.id(), ref);
    }

    updateColumnWithLayout = () => {
        const { column, boardRepository } = this.props;

        boardRepository.updateColumnWithLayout(column.id());
    }

    renderWrapperRow = (item) => {
        const { renderWrapperRow } = this.props;
        const props = {
            onPressIn: (y) => this.onPressIn(item, y),
            onPress: this.onPress(item),
            hidden: item.isHidden(),
            item,
        };
        return (
            <RowWrapper
                ref={(ref) => this.setItemRef(item, ref)}
                collapsable={false}
                onLayout={this.updateItemWithLayout(item)}
                key={item.id.toString()}
            >
                {renderWrapperRow(props)}
            </RowWrapper>
        );
    }

    handleScroll = (event) => {
        const {
            column,
            onScrollingStarted,
            boardRepository,
            unsubscribeFromMovingMode,
        } = this.props;

        unsubscribeFromMovingMode();
        onScrollingStarted();

        const col = boardRepository.column(column.id());

        const liveOffset = event.nativeEvent.contentOffset.y;

        this.scrollingDown = liveOffset > col.scrollOffset();
    }

    endScrolling = (event) => {
        const {
            column,
            onScrollingEnded,
            boardRepository,
        } = this.props;

        const currentOffset = event.nativeEvent.contentOffset.y;
        const col = boardRepository.column(column.id());
        const scrollingDownEnded = this.scrollingDown && currentOffset >= col.scrollOffset();
        const scrollingUpEnded = !this.scrollingDown && currentOffset <= col.scrollOffset();

        if (scrollingDownEnded || scrollingUpEnded) {
            boardRepository.setScrollOffset(col.id(), currentOffset);
            boardRepository.updateColumnsLayoutAfterVisibilityChanged();
            onScrollingEnded();
        }
    }

    onScrollEndDrag = (event) => {
        this.endScrolling(event);
    }

    onMomentumScrollEnd = (event) => {
        const { onScrollingEnded } = this.props;

        this.endScrolling(event);
        onScrollingEnded();
    }

    onContentSizeChange = (_, contentHeight) => {
        const { column, boardRepository } = this.props;

        boardRepository.setContentHeight(column.id(), contentHeight);
    }

    handleChangeVisibleItems = (visibleItems) => {
        const { column, boardRepository } = this.props;

        boardRepository.updateItemsVisibility(column.id(), visibleItems);
    }

    setListView = (ref) => {
        const { column, boardRepository } = this.props;

        boardRepository.setListView(column.id(), ref);
    }

    render() {
        const {
            badgeBackgroundColor,
            badgeBorderRadius,
            badgeHeight,
            badgeWidth,
            badgeTextColor,
            badgeTextFontFamily,
            badgeTextFontSize,
            column,
            columnBackgroundColor,
            columnBorderRadius,
            columnHeight,
            columnNameFontFamily,
            columnNameFontSize,
            columnNameTextColor,
            emptyComponent,
            isWithCountBadge,
            oneColumn,
            movingMode,
            boardRepository,
            viewRightHeaderColumn,
            viewRightHeaderEmptyColumn,
        } = this.props;

        const colElements = boardRepository.items(column.id()).length - 1;
        const ColumnComponent = (
            <ColumnWrapper
                backgroundColor={columnBackgroundColor}
                borderRadius={columnBorderRadius}
                ref={this.setColumnRef}
                collapsable={false}
                onLayout={this.updateColumnWithLayout}
                columnHeight={columnHeight}
                width={oneColumn ? ONE_COLUMN_WIDTH : COLUMN_WIDTH}
                marginRight={oneColumn ? 0 : 8}
            >
                <View style={styles.v1}>
                    <View style={styles.v2}>
                        <View style={styles.v3}>
                            <Paragraph
                                fontSize={columnNameFontSize}
                                fontFamily={columnNameFontFamily}
                                color={columnNameTextColor}
                            >
                                {column.data().name}
                            </Paragraph>
                        </View>
                        {(isWithCountBadge && colElements > 0) && <View style={styles.viewCol}>
                            <Image
                                style={styles.iconCol}
                                resizeMode='contain'
                                source={require('../../assets/icons/ic_totalCard.png')}
                            />
                            <Text style={styles.txtColElement}
                            >
                                {colElements.toString()}
                            </Text>
                        </View>
                        }
                    </View>
                    {
                        (colElements === 0 && viewRightHeaderEmptyColumn)
                            ?
                            viewRightHeaderEmptyColumn(column?.attributes?.data)
                            : null
                    }
                    {(colElements > 0 && viewRightHeaderColumn) ? viewRightHeaderColumn(column?.attributes?.data) : null}
                </View>
                {boardRepository.
                    items(column.id()).length - 1 === 0 ?
                    (emptyComponent ?
                        emptyComponent(column?.attributes?.data) :
                        <EmptyColumn
                            {...this.props}
                            marginTop={columnHeight / 3}
                        />
                    ) :
                    <FlatList
                        data={boardRepository.items(column.id())}
                        ref={this.setListView}
                        onScroll={this.handleScroll}
                        scrollEventThrottle={0}
                        onMomentumScrollEnd={this.onMomentumScrollEnd}
                        onScrollEndDrag={this.onScrollEndDrag}
                        onChangeVisibleRows={this.handleChangeVisibleItems}
                        renderItem={(item) => this.renderWrapperRow(item.item)}
                        keyExtractor={(item) => item.row().id.toString()}
                        scrollEnabled={!movingMode}
                        onContentSizeChange={this.onContentSizeChange}
                        showsVerticalScrollIndicator={false}
                        enableEmptySections={true}
                    />
                }
            </ColumnWrapper>
        );

        return ColumnComponent;
    }
}

Column.defaultProps = {
    badgeBackgroundColor: colors.blurple,
    badgeBorderRadius: 15,
    badgeHeight: 30,
    badgeWidth: 30,
    badgeTextColor: colors.white,
    badgeTextFontFamily: '',
    badgeTextFontSize: 14,
    columnBackgroundColor: colors.fallingStar,
    columnBorderRadius: 6,
    columnHeight: 650,
    columnNameTextColor: colors.blurple,
    columnNameFontFamily: '',
    columnNameFontSize: 18,
    isWithCountBadge: true,
    oneColumn: false,
    viewRightHeaderColumn: null,
    viewRightHeaderEmptyColumn: null,
};

Column.propTypes = {
    badgeBackgroundColor: string.isRequired,
    badgeBorderRadius: number.isRequired,
    badgeHeight: number.isRequired,
    badgeWidth: number.isRequired,
    badgeTextColor: string.isRequired,
    badgeTextFontFamily: string.isRequired,
    badgeTextFontSize: number.isRequired,
    column: object,
    columnBackgroundColor: string.isRequired,
    columnBorderRadius: number.isRequired,
    columnHeight: number.isRequired,
    columnNameFontFamily: string.isRequired,
    columnNameFontSize: number.isRequired,
    columnNameTextColor: string.isRequired,
    emptyComponent: func,
    isWithCountBadge: bool.isRequired,
    movingMode: bool.isRequired,
    oneColumn: bool,
    onPress: func.isRequired,
    onPressIn: func.isRequired,
    onScrollingEnded: func.isRequired,
    onScrollingStarted: func.isRequired,
    renderWrapperRow: func.isRequired,
    boardRepository: object,
    unsubscribeFromMovingMode: func.isRequired,
    viewRightHeaderColumn: func,
    viewRightHeaderEmptyColumn: func,
};

export default Column;

const styles = StyleSheet.create({
    viewCol: {
        flexDirection: 'row',
        marginLeft: 8, alignItems: 'center', justifyContent: 'center',
    },
    iconCol: {
        width: 24,
        height: 24,
    },
    txtColElement: { fontSize: 14, fontWeight: '500', color: '#1B2C3D' },
    v3: { flex: 1 },
    v2: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
    },
    v1: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
});