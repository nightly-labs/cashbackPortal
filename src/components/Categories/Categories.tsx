import styles from './styles.module.css'
import { type FormEvent, type KeyboardEvent, type MouseEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import useWindowSize from '../../utils/hooks/useWindowSize';
import Icon from '../Icon/Icon';
import resetEmbeddingScroll from '../../utils/resetEmbeddingScroll';

interface Props {
    categories: Category[];
    category: Category | null;
    onClickFn: (category: Category) => void;
    searchValue?: ReactSelectOptionType | null;
    onSearchFn?: (value: ReactSelectOptionType | null) => void;
}

const sizes = [
    [1190, 10],
    [990, 8],
    [300, 3]
]

const dragThresholdPx = 6
const dragClickSuppressMs = 150

const Categories = ({ categories, category, onClickFn, searchValue, onSearchFn }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragRef = useRef({
        isPointerDown: false,
        isDragging: false,
        pointerId: null as number | null,
        startX: 0,
        endX: 0,
        endY: 0,
        scrollLeft: 0,
        lastDraggedAt: 0,
    });
    const [maxCategories, setMaxCategories] = useState(10)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchInput, setSearchInput] = useState('')
    const [isDraggingCategories, setIsDraggingCategories] = useState(false)
    const view = useWindowSize()

    useEffect(() => {
        for (const item of sizes) {
            if (view.width >= item[0]) {
                setMaxCategories(item[1])
                break
            }
        }
    }, [view.width])

    useEffect(() => {
        if (!isSearchOpen) return
        inputRef.current?.focus()
    }, [isSearchOpen])

    useEffect(() => {
        setSearchInput(searchValue?.value ?? '')
    }, [searchValue])

    const scrollLeft = (): void => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -500, behavior: 'smooth' });
        }
    };

    const scrollRight = (): void => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 500, behavior: 'smooth' });
        }
    };

    const handleCategoryDragStart = (e: PointerEvent<HTMLDivElement>) => {
        const scrollEl = scrollRef.current

        if (!showArrows || !scrollEl || (e.pointerType === 'mouse' && e.button !== 0)) return

        dragRef.current = {
            ...dragRef.current,
            isPointerDown: true,
            isDragging: false,
            pointerId: e.pointerId,
            startX: e.clientX,
            endX: e.clientX,
            endY: e.clientY,
            scrollLeft: scrollEl.scrollLeft,
        }

    }

    const handleCategoryDragMove = (e: PointerEvent<HTMLDivElement>) => {
        const scrollEl = scrollRef.current
        const drag = dragRef.current

        if (!scrollEl || !drag.isPointerDown || drag.pointerId !== e.pointerId) return

        const distance = e.clientX - drag.startX

        if (!drag.isDragging && Math.abs(distance) < dragThresholdPx) return

        if (!drag.isDragging) {
            drag.isDragging = true
            e.currentTarget.setPointerCapture(e.pointerId)
            setIsDraggingCategories(true)
        }

        e.preventDefault()
        scrollEl.scrollLeft = drag.scrollLeft - distance
    }

    const handleCategoryDragEnd = (e: PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current

        if (drag.pointerId !== null && e.currentTarget.hasPointerCapture(drag.pointerId)) {
            e.currentTarget.releasePointerCapture(drag.pointerId)
        }

        if (drag.isDragging) {
            drag.lastDraggedAt = Date.now()
            drag.endX = e.clientX
            drag.endY = e.clientY
        }

        drag.isPointerDown = false
        drag.isDragging = false
        drag.pointerId = null
        setIsDraggingCategories(false)
    }

    const handleCategoryClick = (e: MouseEvent<HTMLButtonElement>, cat: Category) => {
        const drag = dragRef.current
        const isDragClick =
            Date.now() - drag.lastDraggedAt < dragClickSuppressMs &&
            Math.abs(e.clientX - drag.endX) <= 2 &&
            Math.abs(e.clientY - drag.endY) <= 2

        if (isDragClick) return

        onClickFn(cat)
    }

    const handlers = useSwipeable({
        onSwipedLeft: () => scrollRight(),
        onSwipedRight: () => scrollLeft(),
    });

    const submitSearchTerm = () => {
        const value = searchInput.trim()
        inputRef.current?.blur()

        if (!value) {
            onSearchFn?.(null)
            setIsSearchOpen(false)
            resetEmbeddingScroll()
            return
        }

        if (!onSearchFn) return

        onSearchFn({ value, label: value })
        setIsSearchOpen(false)
        resetEmbeddingScroll()
    }

    const handleSearchInputChange = (value: string) => {
        setSearchInput(value)

        if (!value.trim() && searchValue?.value) {
            onSearchFn?.(null)
        }
    }

    const submitSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        submitSearchTerm()
    }

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return
        e.preventDefault()
        submitSearchTerm()
    }

    const closeSearch = () => {
        if (searchInput.trim()) return
        setIsSearchOpen(false)
    }

    const showArrows = categories.length > maxCategories
    const searchControl = (
        <>
            <button
                id="categories-search-open"
                type="button"
                className={styles.search_button}
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search"
            >
                <Icon name="category-search.svg" alt="" width={16} height={16} />
            </button>
            <form
                className={`${styles.search_bar} ${isSearchOpen ? styles.search_bar_open : ''}`}
                onSubmit={submitSearch}
            >
                <input
                    ref={inputRef}
                    id="categories-search-input"
                    className={styles.search_input}
                    value={searchInput}
                    onChange={e => handleSearchInputChange(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onBlur={closeSearch}
                    placeholder="Search"
                />
                <button type="submit" className={styles.search_submit} aria-label="Search">
                    <Icon name="category-search.svg" alt="" width={16} height={16} />
                </button>
            </form>
        </>
    )

    if (!categories.length) {
        return (
            <div className={styles.container}>
                <div className={`${styles.categories} ${styles.categories_static}`}>
                    {Array(maxCategories).fill(0).map((_, index) => (
                        <button id={`category-skeleton-${index}`} className={`${styles.category} ${styles.skeleton}`} key={index}></button>
                    ))}
                </div>
                {searchControl}
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {showArrows ?
                <button
                    id="categories-arrow-left"
                    className={`${styles.arrow} ${styles.arrow_left}`}
                    onClick={scrollLeft}
                >
                    &#8249;
                </button>
                : null}
            <div
                id={showArrows ? "categories-scrollable" : undefined}
                className={`${styles.categories} ${showArrows ? styles.categories_scrollable : styles.categories_static} ${isDraggingCategories ? styles.categories_dragging : ''}`}
                {...(showArrows ? handlers : {})}
                ref={scrollRef}
                onPointerDown={handleCategoryDragStart}
                onPointerMove={handleCategoryDragMove}
                onPointerUp={handleCategoryDragEnd}
                onPointerCancel={handleCategoryDragEnd}
            >
                {categories.map(cat => (
                    <button
                        id={`${showArrows ? 'category-scroll' : 'category'}-${cat.name}`}
                        onClick={(e) => handleCategoryClick(e, cat)}
                        key={cat.id}
                        className={`${styles.category} ${cat === category ? styles.selected : ''}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            {showArrows ?
                <button
                    id="categories-arrow-right"
                    className={`${styles.arrow} ${styles.arrow_right}`}
                    onClick={scrollRight}
                >
                    &#8250;
                </button>
                : null}
            {searchControl}
        </div>
    );
};

export default Categories;
