<!-- AUTO-GENERATED — do not edit by hand. Run: pnpm gen:diagrams -->
```mermaid
graph TD
    subgraph types
        WeatherCondition["WeatherCondition"]
        Pm10Grade["Pm10Grade"]
        WeatherLayer["WeatherLayer"]
        WeatherSlotSource["WeatherSlotSource"]
        WeatherSourceKey["WeatherSourceKey"]
        HourlyWeather["HourlyWeather"]
        DongWeather["DongWeather"]
        WeatherSourceError["WeatherSourceError"]
        SeoulMonthlyWeather["SeoulMonthlyWeather"]
        MonthAvailability["MonthAvailability"]
        VilageFcstOriginalItem["VilageFcstOriginalItem"]
        AirKoreaRltmItem["AirKoreaRltmItem"]
        WeatherMetrics["WeatherMetrics"]
        RouteAttributes["RouteAttributes"]
        SuitabilityResult["SuitabilityResult"]
        RecommendedRoute["RecommendedRoute"]
        UserRoute["UserRoute"]
        UserPace["UserPace"]
        NodeType["NodeType"]
        BaseAttribute["BaseAttribute"]
        NodeAttribute["NodeAttribute"]
        Resources["Resources"]
        Camera["Camera"]
        BaseNode["BaseNode"]
        ThemeMapData["ThemeMapData"]
        ThemeMapAttribute["ThemeMapAttribute"]
        RelatedTheme["RelatedTheme"]
        ThemeMap["ThemeMap"]
        PoiData["PoiData"]
        CameraPosition["CameraPosition"]
        ProgressInfo["ProgressInfo"]
        PlaybackSpeed["PlaybackSpeed"]
        PlaybackState["PlaybackState"]
        RouteInfoDraftInput["RouteInfoDraftInput"]
        SavedRouteInfo["SavedRouteInfo"]
        SectionAttr["SectionAttr"]
        RouteGeoJson["RouteGeoJson"]
        RouteElevationPoint["RouteElevationPoint"]
        RouteElevationSection["RouteElevationSection"]
        RouteElevationProfile["RouteElevationProfile"]
        RouteBase["RouteBase"]
        RouteDraftInput["RouteDraftInput"]
        SavedRoute["SavedRoute"]
        RouteSectionBase["RouteSectionBase"]
        RouteSectionDraftInput["RouteSectionDraftInput"]
        SavedSection["SavedSection"]
        RouteSectionCreateInput["RouteSectionCreateInput"]
        RouteOptimizationModeDefinition["RouteOptimizationModeDefinition"]
        RouteOptimizationMode["RouteOptimizationMode"]
        RouteOptimizeRequest["RouteOptimizeRequest"]
        RouteOptimizeResponse["RouteOptimizeResponse"]
        DustGradeEnum["DustGradeEnum"]
        DifficultyLevel["DifficultyLevel"]
        GradientSegment["GradientSegment"]
        GeoJsonPosition["GeoJsonPosition"]
        GeoJson["GeoJson"]
        GeoJsonPoint["GeoJsonPoint"]
        GeoJsonLineString["GeoJsonLineString"]
        GeoJsonPolygon["GeoJsonPolygon"]
        GeoJsonMultiPolygon["GeoJsonMultiPolygon"]
        GeoFeature["GeoFeature"]
        FacilityType["FacilityType"]
        PoiType["PoiType"]
        PoiDraftInput["PoiDraftInput"]
        Facility["Facility"]
        FacilityLayerConfig["FacilityLayerConfig"]
        SeoulGuMeta["SeoulGuMeta"]
        SeoulDongMap["SeoulDongMap"]
        SeoulDistrictData["SeoulDistrictData"]
        RouteDiscoverFilter["RouteDiscoverFilter"]
        RouteDiscoverCard["RouteDiscoverCard"]
        CommonResponse["CommonResponse"]
        CommonError["CommonError"]
        CesiumDrawHandler["CesiumDrawHandler"]
        CesiumRuntime["CesiumRuntime"]
        GeoJsonDataSourceInstance["GeoJsonDataSourceInstance"]
        GeoJsonEntityInstance["GeoJsonEntityInstance"]
        GroundPolylinePrimitiveInstance["GroundPolylinePrimitiveInstance"]
        CesiumSceneRuntime["CesiumSceneRuntime"]
        CesiumViewerRuntime["CesiumViewerRuntime"]
    end
    subgraph schemas
        weatherConditionSchema["weatherConditionSchema"]
        pm10GradeSchema["pm10GradeSchema"]
        weatherSlotSourceSchema["weatherSlotSourceSchema"]
        weatherSourceKeySchema["weatherSourceKeySchema"]
        hourlyWeatherSchema["hourlyWeatherSchema"]
        dongWeatherSchema["dongWeatherSchema"]
        weatherSourceErrorSchema["weatherSourceErrorSchema"]
        seoulMonthlyWeatherSchema["seoulMonthlyWeatherSchema"]
        monthAvailabilitySchema["monthAvailabilitySchema"]
        createRouteInfoSchema["createRouteInfoSchema"]
        geoJsonPointSchema["geoJsonPointSchema"]
        poiSchema["poiSchema"]
        geoJsonLineStringPositionSchema["geoJsonLineStringPositionSchema"]
        geoJsonLineStringSchema["geoJsonLineStringSchema"]
        sectionAttrSchema["sectionAttrSchema"]
        createSectionSchema["createSectionSchema"]
        createRouteSchema["createRouteSchema"]
        routeOptimizationModeSchema["routeOptimizationModeSchema"]
        routeOptimizeRequestSchema["routeOptimizeRequestSchema"]
        routeOptimizeResponseSchema["routeOptimizeResponseSchema"]
        geoJsonPositionSchema["geoJsonPositionSchema"]
        facilityTypeSchema["facilityTypeSchema"]
        poiTypeSchema["poiTypeSchema"]
        facilitySchema["facilitySchema"]
    end
    subgraph services
        IRouteInfoRepository["IRouteInfoRepository"]
        IRouteRepository["IRouteRepository"]
        IFacilityRepository["IFacilityRepository"]
        api___date__get["api___date__get"]
        api___month__get["api___month__get"]
        api__search_get["api__search_get"]
        api__recommend_get["api__recommend_get"]
        api__optimize_post["api__optimize_post"]
        api__index_post["api__index_post"]
        api__index_get["api__index_get"]
        api__discover_get["api__discover_get"]
        api___routeId__get["api___routeId__get"]
        api___routeId__post["api___routeId__post"]
        api__sections_get["api__sections_get"]
        api__index_put["api__index_put"]
        api__index_delete["api__index_delete"]
        api__nearby_get["api__nearby_get"]
        api__seoul_get["api__seoul_get"]
        api__seoul_dong_get["api__seoul-dong_get"]
        api______all_["api______all_"]
    end
    WeatherCondition --> Pm10Grade
    WeatherCondition --> WeatherLayer
    WeatherCondition --> WeatherSlotSource
    WeatherCondition --> WeatherSourceKey
    WeatherCondition --> HourlyWeather
    WeatherCondition --> DongWeather
    WeatherCondition --> WeatherSourceError
    WeatherCondition --> SeoulMonthlyWeather
    WeatherCondition --> MonthAvailability
    WeatherCondition --> VilageFcstOriginalItem
    NodeAttribute -->|extends| BaseAttribute
    ThemeMapAttribute -->|extends| BaseAttribute
    NodeType --> BaseAttribute
    NodeType --> NodeAttribute
    NodeType --> Resources
    NodeType --> Camera
    NodeType --> BaseNode
    NodeType --> ThemeMapData
    NodeType --> ThemeMapAttribute
    NodeType --> RelatedTheme
    NodeType --> ThemeMap
    NodeType --> PoiData
    NodeType --> GeoJsonPosition
    NodeType --> GeoJson
    PlaybackSpeed --> PlaybackState
    SavedRouteInfo -->|extends| RouteInfoDraftInput
    RouteInfoDraftInput --> SavedRouteInfo
    RouteInfoDraftInput --> SavedRoute
    RouteInfoDraftInput --> Facility
    SavedRoute -->|extends| RouteBase
    RouteSectionDraftInput -->|extends| RouteSectionBase
    SavedSection -->|extends| RouteSectionBase
    RouteSectionCreateInput -->|extends| RouteSectionBase
    SectionAttr --> RouteGeoJson
    SectionAttr --> RouteElevationPoint
    SectionAttr --> RouteElevationSection
    SectionAttr --> RouteElevationProfile
    SectionAttr --> RouteBase
    SectionAttr --> RouteDraftInput
    SectionAttr --> SavedRoute
    SectionAttr --> RouteSectionBase
    SectionAttr --> RouteSectionDraftInput
    SectionAttr --> SavedSection
    SectionAttr --> RouteSectionCreateInput
    SectionAttr --> GeoJson
    SectionAttr --> GeoJsonLineString
    SectionAttr --> PoiDraftInput
    RouteOptimizationMode --> RouteOptimizeRequest
    RouteOptimizationMode --> RouteOptimizeResponse
    RouteOptimizationMode --> GeoJsonPosition
    RouteOptimizationMode --> GeoJson
    DustGradeEnum --> Pm10Grade
    DifficultyLevel --> GradientSegment
    GeoJsonPosition --> GeoJson
    GeoJsonPosition --> GeoJsonPoint
    GeoJsonPosition --> GeoJsonLineString
    GeoJsonPosition --> GeoJsonPolygon
    GeoJsonPosition --> GeoJsonMultiPolygon
    GeoJsonPosition --> GeoFeature
    FacilityType --> GeoJson
    FacilityType --> GeoJsonPoint
    FacilityType --> PoiType
    FacilityType --> PoiDraftInput
    FacilityType --> Facility
    FacilityType --> FacilityLayerConfig
    SeoulDongMap --> SeoulGuMeta
    SeoulDongMap --> SeoulDistrictData
    weatherConditionSchema --> pm10GradeSchema
    weatherConditionSchema --> weatherSlotSourceSchema
    weatherConditionSchema --> weatherSourceKeySchema
    weatherConditionSchema --> hourlyWeatherSchema
    pm10GradeSchema --> weatherConditionSchema
    pm10GradeSchema --> weatherSlotSourceSchema
    pm10GradeSchema --> weatherSourceKeySchema
    pm10GradeSchema --> hourlyWeatherSchema
    weatherSlotSourceSchema --> weatherConditionSchema
    weatherSlotSourceSchema --> pm10GradeSchema
    weatherSlotSourceSchema --> weatherSourceKeySchema
    weatherSlotSourceSchema --> hourlyWeatherSchema
    weatherSlotSourceSchema --> dongWeatherSchema
    weatherSourceKeySchema --> weatherConditionSchema
    weatherSourceKeySchema --> pm10GradeSchema
    weatherSourceKeySchema --> weatherSlotSourceSchema
    weatherSourceKeySchema --> hourlyWeatherSchema
    weatherSourceKeySchema --> dongWeatherSchema
    hourlyWeatherSchema --> weatherConditionSchema
    hourlyWeatherSchema --> pm10GradeSchema
    hourlyWeatherSchema --> weatherSlotSourceSchema
    hourlyWeatherSchema --> dongWeatherSchema
    dongWeatherSchema --> weatherSourceKeySchema
    dongWeatherSchema --> hourlyWeatherSchema
    dongWeatherSchema --> weatherSourceErrorSchema
    dongWeatherSchema --> seoulMonthlyWeatherSchema
    weatherSourceErrorSchema --> weatherSourceKeySchema
    weatherSourceErrorSchema --> dongWeatherSchema
    weatherSourceErrorSchema --> seoulMonthlyWeatherSchema
    weatherSourceErrorSchema --> monthAvailabilitySchema
    seoulMonthlyWeatherSchema --> weatherSourceKeySchema
    seoulMonthlyWeatherSchema --> dongWeatherSchema
    seoulMonthlyWeatherSchema --> weatherSourceErrorSchema
    seoulMonthlyWeatherSchema --> monthAvailabilitySchema
    geoJsonPointSchema --> poiSchema
    geoJsonPointSchema --> geoJsonLineStringPositionSchema
    geoJsonPointSchema --> geoJsonLineStringSchema
    geoJsonPointSchema --> geoJsonPositionSchema
    poiSchema --> geoJsonPointSchema
    poiSchema --> geoJsonLineStringPositionSchema
    poiSchema --> geoJsonLineStringSchema
    poiSchema --> sectionAttrSchema
    poiSchema --> geoJsonPositionSchema
    geoJsonLineStringPositionSchema --> poiSchema
    geoJsonLineStringPositionSchema --> geoJsonLineStringSchema
    geoJsonLineStringPositionSchema --> sectionAttrSchema
    geoJsonLineStringPositionSchema --> createSectionSchema
    geoJsonLineStringPositionSchema --> geoJsonPositionSchema
    geoJsonLineStringSchema --> poiSchema
    geoJsonLineStringSchema --> geoJsonLineStringPositionSchema
    geoJsonLineStringSchema --> sectionAttrSchema
    geoJsonLineStringSchema --> createSectionSchema
    geoJsonLineStringSchema --> createRouteSchema
    sectionAttrSchema --> poiSchema
    sectionAttrSchema --> geoJsonLineStringSchema
    sectionAttrSchema --> createSectionSchema
    sectionAttrSchema --> createRouteSchema
    createSectionSchema --> poiSchema
    createSectionSchema --> geoJsonLineStringSchema
    createSectionSchema --> sectionAttrSchema
    createSectionSchema --> createRouteSchema
    createRouteSchema --> sectionAttrSchema
    routeOptimizationModeSchema --> routeOptimizeRequestSchema
    routeOptimizationModeSchema --> routeOptimizeResponseSchema
    routeOptimizationModeSchema --> geoJsonPositionSchema
    routeOptimizeRequestSchema --> routeOptimizationModeSchema
    routeOptimizeRequestSchema --> routeOptimizeResponseSchema
    routeOptimizeRequestSchema --> geoJsonPositionSchema
    routeOptimizeResponseSchema --> routeOptimizationModeSchema
    routeOptimizeResponseSchema --> routeOptimizeRequestSchema
    routeOptimizeResponseSchema --> geoJsonPositionSchema
    facilityTypeSchema --> geoJsonPointSchema
    facilityTypeSchema --> poiTypeSchema
    facilityTypeSchema --> facilitySchema
    poiTypeSchema --> geoJsonPointSchema
    poiTypeSchema --> facilityTypeSchema
    poiTypeSchema --> facilitySchema
    facilitySchema --> facilityTypeSchema
```
