import styles from './styles.module.css'
// hooks
import { Fragment, MouseEvent, useEffect, useId, useState } from "react"

// components
import Select, {
    components,
    StylesConfig,
    SingleValue,
    MultiValue,
    ControlProps,
    NoticeProps,
    SingleValueProps,
} from "react-select"
import { useGoogleAnalytics } from '../../utils/hooks/useGoogleAnalytics'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'use-debounce'
import Icon from '../Icon/Icon'

interface Props {
    options: ReactSelectOptionType[]
    value: ReactSelectOptionType | null
    onChangeFn: (value: ReactSelectOptionType | null) => void
}

const customStyles: StylesConfig<ReactSelectOptionType> = {
    control: (base, state) => ({
        ...base,
        border: "var(--search-border-w) solid var(--search-border-c)",
        borderBottom: state.menuIsOpen ? "none" : "1px solid var(--search-border-c)",
        borderRadius: "var(--search-radius)",
        borderBottomLeftRadius: state.menuIsOpen ? 0 : "var(--search-radius)",
        borderBottomRightRadius: state.menuIsOpen ? 0 : "var(--search-radius)",
        alignContent: "center",
        "&:hover": {
            border: "var(--search-border-w) solid var(--search-border-c)",
            borderBottom: state.menuIsOpen ?
                "none" :
                "var(--search-border-w) solid var(--search-border-c)",
        },
        backgroundColor: "var(--search-bg)",
        width: "438px",
        height: "48px",
        padding: "4px 8px 4px 12px",
        fontSize: "var(--search-f-s)",
        fontWeight: "var(--search-f-w)",
        cursor: "text",
        boxShadow: "none",
        outline: "none !important",
        "@media only screen and (max-width: 1280px)": {
            width: "342px",
        }
    }),
    menuList: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
        "&:last-child": {
            borderBottomLeftRadius: "var(--search-radius)",
            borderBottomRightRadius: "var(--search-radius)",
        },
        "::-webkit-scrollbar": {
            width: "10px",
        },
        "::-webkit-scrollbar-track": {
            background: "transparent",
        },
        "::-webkit-scrollbar-thumb": {
            background: "var(--search-scrollbar-bg)",
            backgroundClip: "padding-box",
            border: "4px solid rgba(7, 19, 23, 0)",
            borderRadius: "10px",
        },
        // "::-webkit-scrollbar-thumb:hover": {
        //     background: "#555",
        // },
    }),
    menu: (base) => ({
        ...base,
        marginTop: 0,
        backgroundColor: "var(--search-bg)",
        border: "var(--search-border-w) solid var(--search-border-c)",
        borderTop: "0",
        boxShadow: 'none',
        borderBottomLeftRadius: "var(--search-radius)",
        borderBottomRightRadius: "var(--search-radius)",
        fontSize: "var(--search-f-s)",
        zIndex: 10,
    }),
    option: (base, state) => ({
        ...base,
        fontWeight: "var(--search-f-w)",
        backgroundColor: state.isFocused
            ? "var(--search-option-hover-bg)"
            : state.isSelected
                ? "var(--search-bg)"
                : base.backgroundColor,
        "&:active": { backgroundColor: "var(--search-option-hover-bg)" },
        color: "var(--search-option-f-c)",
        cursor: "pointer",
        paddingLeft: '40px',
    }),
    input: (base) => ({
        ...base,
        "input[type='text']:focus": { boxShadow: "none" },
        color: "var(--search-f-c)",
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--search-placeholder-f-c)'
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--search-f-c)',
    }),
}

const CustomSingleValue = (
    props: SingleValueProps<ReactSelectOptionType> & { isFocused: boolean },
) => {
    const { children, ...rest } = props
    const { selectProps, isFocused } = props
    if (selectProps.menuIsOpen || isFocused) return <Fragment></Fragment>
    return <components.SingleValue {...rest}>{children}</components.SingleValue>
}

const CustomNoOptionsMessage = (props: NoticeProps<ReactSelectOptionType>) => {
    if (props.selectProps.inputValue.length <= 1) {
        return null
    }

    return (
        <components.NoOptionsMessage {...props}>
            No options
        </components.NoOptionsMessage>
    )
}

const CustomControl = (props: ControlProps<ReactSelectOptionType>) => {
    return (
        <components.Control {...props}>
            <Icon
                height={20}
                width={20}
                name="magnifying-glass.svg"
                alt="magnifying-glass-icon"
            />
            {props.children}
        </components.Control>
    )
}

const Search = ({ options, value, onChangeFn }: Props): JSX.Element => {
    const id = useId()
    const [input, setInput] = useState('')
    const [debouncedInput] = useDebounce(input, 500)
    const [filteredOptions, setFilteredOptions] = useState<ReactSelectOptionType[]>(options)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [msg, setMsg] = useState("")
    const { sendGaEvent } = useGoogleAnalytics()
    const { t } = useTranslation()

    useEffect(() => {
        if (!debouncedInput.length) return
        sendGaEvent("search_input", {
            category: "user_action",
            action: "input",
            details: debouncedInput,
            hasResults: !!filteredOptions.length,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedInput])

    const handleChange = (
        item:
            | SingleValue<ReactSelectOptionType>
            | MultiValue<ReactSelectOptionType>
            | null,
    ) => {
        if (!item) {
            onChangeFn(null)
            return
        }

        if (Array.isArray(item)) return

        const { value } = item as ReactSelectOptionType

        sendGaEvent("search_select", {
            category: "user_action",
            action: "select",
            details: value,
        })

        onChangeFn({ value, label: value })
        setIsFocused(false)
    }

    const handleInputChange = (inputValue: string) => {
        setInput(inputValue)
        // eslint-disable-next-line no-unsafe-optional-chaining
        if (!inputValue || (inputValue?.trim()).length < 2) {
            // eslint-disable-next-line no-unsafe-optional-chaining
            if ((inputValue?.trim()).length == 1) {
                setMsg("Keep typing...")
            } else if (msg.length) {
                setMsg("")
            }
            if (isMenuOpen) setIsMenuOpen(false)
            if (filteredOptions.length) {
                setFilteredOptions([])
            }
        } else {
            const input = inputValue.trimStart().toLowerCase()
            if (msg.length) setMsg("")
            if (!isMenuOpen && input.length > 1) setIsMenuOpen(true)

            // if (input.length === 3) {
            //     sendGaEvent("search_input", {
            //         category: "user_action",
            //         action: "input",
            //         details: input,
            //     })
            // }
            let filtered: ReactSelectOptionType[] = []
            const notFirstWordMatches: ReactSelectOptionType[] = []
            if (options?.length) {
                options.forEach((e) => {
                    if (e.label.toLowerCase().startsWith(input)) {
                        filtered.push(e)
                    } else if (
                        e.label.includes(" ") &&
                        !e.label.toLowerCase().startsWith(input)
                    ) {
                        const words = e.label.toLowerCase().split(/\s+/)
                        if (words.some((word: string) => word.startsWith(input))) {
                            notFirstWordMatches.push(e)
                        }
                    }
                })
                if (notFirstWordMatches.length) {
                    filtered = filtered.concat(notFirstWordMatches)
                }
            }
            setFilteredOptions(filtered)
        }
    }

    const handleClick = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
        const target = e.target as HTMLElement

        if (target.id.includes("option")) return;
        setIsFocused(true)
    }

    return (
        <div
            id="search-container"
            onClick={e => handleClick(e)}
            className={styles.search}>
            <Select
                id="search-select"
                instanceId={id}
                placeholder={t('searchPlaceholder')}
                styles={customStyles}
                components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    Control: CustomControl,
                    NoOptionsMessage: CustomNoOptionsMessage,
                    SingleValue: (props) => CustomSingleValue({ ...props, isFocused }),
                }}
                isMulti={false}
                isClearable
                menuIsOpen={isMenuOpen}
                options={filteredOptions}
                onChange={handleChange}
                onInputChange={handleInputChange}
                value={value}
                onBlur={() => setIsFocused(false)}
            />
            {msg.length ? (
                <div className={styles.msg}>
                    {msg}
                </div>
            ) : null}
        </div>
    )
}

export default Search
