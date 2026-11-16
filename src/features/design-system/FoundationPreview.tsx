import { useState, type CSSProperties } from "react";
import { Button } from "@/src/components/ui/Button";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { sidebarCssVariables } from "@/src/design-system/sidebar";
import { t } from "@/src/i18n/ui";
import { dimensionTokens, foundationTokens, motionTokens, radiusTokens, shadowTokens } from "./tokenCatalog";

function TokenValues({ tokens }: { tokens: string[] }) {
  return <dl className="token-values">{tokens.map((token) => <div key={token}><dt>{token}</dt><dd>{foundationTokens[token]}</dd></div>)}</dl>;
}

export function FoundationPreview() {
  const [duration, setDuration] = useState("--duration-fast");
  const [active, setActive] = useState(false);
  return <div className="component-stack" style={sidebarCssVariables as CSSProperties}>
    <h3>{t("圆角与阴影")}</h3>
    <div className="token-specimens">{radiusTokens.map((token) => <div className="token-radius" key={token} style={{ borderRadius: `var(${token})` }}><code>{token}</code><span>{foundationTokens[token]}</span></div>)}</div>
    <div className="token-specimens">{shadowTokens.map((token) => <div className="token-shadow" key={token} style={{ boxShadow: `var(${token})` }}><code>{token}</code></div>)}</div>
    <h3>{t("尺寸、间距与比例")}</h3><TokenValues tokens={dimensionTokens} />
    <h3>{t("动效时间与曲线")}</h3>
    <div className="component-row"><SelectMenu label={t("动效时长")} value={duration} options={motionTokens.filter((token) => /ms$/.test(foundationTokens[token]!)).map((token) => ({ value: token, label: `${token} · ${foundationTokens[token]}` }))} onChange={setDuration} /><Button onPress={() => setActive((value) => !value)}>{t("播放动效")}</Button></div>
    <div className="token-motion-track" aria-hidden="true"><span className={active ? "is-active" : undefined} style={{ transitionDuration: `var(${duration})` }} /></div>
    <TokenValues tokens={motionTokens} />
  </div>;
}
