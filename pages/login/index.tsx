import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

const IPhone1610: NextPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    // 로그인 로직 구현
    console.log("로그인 시도:", { email, password });
    alert("로그인 기능은 추후 구현됩니다.");
  };
  return (
    <>
      <Head>
        <title>로그인 | MomHealth</title>
      </Head>
      <div className={styles.centerWrap}>
        <div className={styles.iphone1610}>
          <div className={styles.statusBarIphone} />
          <div className={styles.homeIndicator}>
            <div className={styles.iphone1610HomeIndicator} />
          </div>
          <div className={styles.container}>
            <div className={styles.contentsLogin}>
              <div className={styles.title}>
                <div className={styles.logoIcon}>
                  <span className="text-2xl">🏥</span>
                </div>
                <b className={styles.h1}>
                  <p className={styles.p}>오늘의 건강</p>
                  <p className={styles.p}>로그인</p>
                </b>
              </div>
              <div className={styles.login}>
                <div className={styles.textfield}>
                  <div className={styles.input}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력해주세요."
                      className={styles.inputField}
                    />
                  </div>
                </div>
                <div className={styles.textfield}>
                  <div className={styles.iphone1610Input}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력해주세요."
                      className={styles.inputField}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.passwordToggle}
                    >
                      <span className="text-lg">
                        {showPassword ? "🙈" : "👁️"}
                      </span>
                    </button>
                  </div>
                </div>
                <button className={styles.buttonLg} onClick={handleLogin}>
                  <div className={styles.label}>로그인</div>
                </button>
              </div>
              <div className={styles.divider}>
                <div className={styles.borderIcon}></div>
                <div className={styles.div}>또는</div>
                <div className={styles.borderIcon}></div>
              </div>
              <div className={styles.socialLogin}>
                <div className={styles.buttonIcon}>
                  <span className="text-xl">💬</span>
                </div>
                <div className={styles.iphone1610ButtonIcon}>
                  <span className="text-xl">💚</span>
                </div>
                <div className={styles.iphone1610ButtonLg}>
                  <span className="text-lg">🔍</span>
                </div>
              </div>
            </div>
            <div className={styles.buttonJoinpw}>
              <div className={styles.buttonLg2}>
                <div className={styles.label}>이메일로 회원가입</div>
              </div>
              <div className={styles.buttonLg3}>
                <div className={styles.label}>비밀번호를 잊으셨나요?</div>
              </div>
            </div>
          </div>
          <div className={styles.supportUistatusBar}>
            <div className={styles.rightSide}>
              <div className={styles.battery}>
                <div className={styles.rectangleIcon}></div>
                <div className={styles.combinedShapeIcon}></div>
                <div className={styles.iphone1610RectangleIcon}></div>
              </div>
              <div className={styles.wifiIcon}>📶</div>
              <div className={styles.mobileSignalIcon}>📱</div>
            </div>
            <div className={styles.leftSideIcon}>9:41</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IPhone1610;
