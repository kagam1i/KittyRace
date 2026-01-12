export default function CatCarouselCard({
    cat,
    previewSrc,
    isUnlocked,
    price,
    canBuy,
    fishIcon,
    onPrev,
    onNext,
    onBuy,
}) {
    return (
        <div
            className="grid items-center gap-4"
            style={{ gridTemplateColumns: "56px 1fr 56px" }}
        >
            {/* LEFT ARROW */}
            <button
                className="ui-arrow-btn"
                onClick={onPrev}
                aria-label="Previous cat"
                title="Previous"
            >
                <span
                    className="text-2xl leading-none"
                    style={{ transform: "translateX(-1px)" }}
                >
                    {"<"}
                </span>
            </button>

            {/* CARD */}
            <div className="border border-border bg-white/55 p-0">
                <div className="grid" style={{ gridTemplateColumns: "220px 1fr" }}>
                    {/* PREVIEW */}
                    <div className="p-4 grid place-items-center">
                        <div
                            className="w-[170px] h-[170px]"
                            style={{
                                backgroundImage: `url(${previewSrc})`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                backgroundSize: "contain",
                                imageRendering: "pixelated",
                            }}
                            aria-label={cat?.id}
                        />
                    </div>

                    {/* INFO */}
                    <div className="p-4 flex flex-col">
                        {/* NAME */}
                        <div className="text-center font-semibold tracking-widest uppercase mb-2">
                            {cat?.id}
                        </div>

                        {/* DESCRIPTION */}
                        <div
                            className="
                border border-border
                bg-white/70 backdrop-blur-[1px]
                p-3
                text-[15px] leading-6
                pixel-text-readable
              "
                        >
                            {cat?.blurb}

                            {Array.isArray(cat?.advantages) &&
                                cat.advantages.length > 0 && (
                                    <ul className="mt-2 list-disc pl-5 text-[14px] leading-6 pixel-text-readable">
                                        {cat.advantages.map((t) => (
                                            <li key={t}>{t}</li>
                                        ))}
                                    </ul>
                                )}
                        </div>

                        {/* PRICE + BUY */}
                        {!isUnlocked && (
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="ui-icon-chip">
                                    <img
                                        src={fishIcon}
                                        alt="Fish"
                                        className="pixelated w-8 h-8"
                                        draggable="false"
                                    />
                                    <span className="ui-icon-chip__count">
                                        {price}
                                    </span>
                                </div>

                                <button
                                    className="ui-btn px-7 py-2"
                                    disabled={!canBuy}
                                    onClick={onBuy}
                                    title={canBuy ? "Buy" : "Not enough fish"}
                                >
                                    BUY
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT ARROW */}
            <button
                className="ui-arrow-btn"
                onClick={onNext}
                aria-label="Next cat"
                title="Next"
            >
                <span
                    className="text-2xl leading-none"
                    style={{ transform: "translateX(1px)" }}
                >
                    {">"}
                </span>
            </button>
        </div>
    );
}
