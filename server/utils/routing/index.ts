// Side-effect imports: trigger self-registration of routing services.
// registry.ts에 두면 circular dependency가 발생하므로 별도 파일에서 실행한다.
// (tmap/osrm → registry → tmap/osrm 순환 방지)
import './tmap.service'
import './osrm.service'
