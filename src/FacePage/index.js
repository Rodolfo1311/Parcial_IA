import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from "react-redux";
import mapStateToProps from './mapStateToProps';
import mapDispatchToProps from './mapDispatchToProps';
import Camera from './Camera';
import Canva from './Canva';
import * as faceapi from 'face-api.js';

class FacePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            controller: 'game',
            loading: false,
            authorized: false,
            checkAutorization: true,
            positionIndex: 0,
            filterName: 'filtro1',
            imageFilter: new Image(),
            showFilter: true,
        }
        this.setVideoHandler = this.setVideoHandler.bind(this);
        this.isModelLoaded = this.isModelLoaded.bind(this);
    }

    async setVideoHandler() {
        if (this.isModelLoaded() !== undefined) {
            try {
                let result = await faceapi.detectSingleFace(this.props.video.current, this.props.detector_options).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
                if (result !== undefined) {
                    console.log("face detected", 1);
                    const dims = faceapi.matchDimensions(this.props.canvas.current, this.props.video.current, true);
                    const resizedResult = faceapi.resizeResults(result, dims);
 //para no mostrar el cuadro                  // faceapi.draw.drawDetections(this.props.canvas.current, resizedResult);
 //para no mostrar los puntos                  // faceapi.draw.drawFaceLandmarks(this.props.canvas.current, resizedResult);

                    const currentCanvas = ReactDOM.findDOMNode(this.props.canvas.current);
                    var canvasElement = currentCanvas.getContext("2d");
                    this.addFilter(canvasElement, result);
                    this.addBoxIndexOfLandmark(canvasElement, result.landmarks.positions[this.state.positionIndex]);
                    this.addBackgroundInformation(canvasElement, result);
                    this.addGenderAndAgeInformation(canvasElement, result);
                    this.addEmotionInformation(canvasElement, resizedResult, result);

                } else {
                    console.log("face detected", 1);
                }
            } catch (exception) {
                console.log(exception);
            }
        }
        setTimeout(() => this.setVideoHandler());
    }


    //se comento esto para o mostrar el cuadrito que recorre los lamdmarks
    /*addBoxIndexOfLandmark(canvasElement, landkmarkPosition) {
        let width = 10, height = 10;
        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
        canvasElement.fillStyle = 'rgb(255, 87, 51)';
        canvasElement.fillRect(landkmarkPosition.x, landkmarkPosition.y, width, height);
        canvasElement.closePath();
        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
    }
*/
    addBackgroundInformation(canvasElement, result) {
        let positionX = result.landmarks.positions[8].x,
            positionY = result.landmarks.positions[8].y + 10;
        canvasElement.fillStyle = "black";
        canvasElement.fillRect(positionX - 45, positionY - 12, 90, 45);
    }

    addGenderAndAgeInformation(canvasElement, result) {
        // Edad y Sexo
        canvasElement.font = "10px Comic Sans MS";
        //canvasElement.font="30px Arial";
        canvasElement.fillStyle = "red";
        let positionX = result.landmarks.positions[8].x,
            positionY = result.landmarks.positions[8].y + 10,
            gender = (result.gender) === "male" ? "Hombre" : "Mujer",
            age = "Edad: " + result.age.toFixed();
        gender = "Sexo: " + gender;

        canvasElement.textAlign = "center";
        canvasElement.fillStyle = "white";
        canvasElement.fillText(gender, positionX, positionY);
        canvasElement.fillText(age, positionX, positionY + 15);
    }

    addEmotionInformation(canvasElement, resizedResult, result) {
        const expressions = resizedResult.expressions;
        const maxValue = Math.max(...Object.values(expressions));
        let emotion = Object.keys(expressions).filter(
            item => expressions[item] === maxValue
        );
        emotion = emotion[0];
        emotion = (emotion === "happy") ? "feliz" : emotion;
        emotion = (emotion === "neutral") ? "neutral" : emotion;
        emotion = (emotion === "angry") ? "enojado" : emotion;
        emotion = (emotion === "sad") ? "triste" : emotion;
        emotion = (emotion === "surprised") ? "sorprendido" : emotion;
        emotion = (emotion === "fearful") ? "temeroso" : emotion;

        let positionX = result.landmarks.positions[8].x,
            positionY = result.landmarks.positions[8].y + 10;
        canvasElement.fillText("Emocion: " + emotion, positionX, positionY + 30);
    }

    addFilter(canvasElement, result) {
        let startIndex = 15, endIndex = 1, ajustX = 0, ajustY = -50;
        let positionX1 = result.landmarks.positions[startIndex].x - ajustX,
            positionY1 = result.landmarks.positions[startIndex].y + ajustY,
            positionX2 = result.landmarks.positions[endIndex].x + ajustX,
            positionY2 = result.landmarks.positions[endIndex].y + ajustY,
            m = ((positionY2 - positionY1) / (positionX2 - positionX1)) * 100;

        let width = positionX2 - positionX1,
            height = width * 0.8;

        positionY1 -= (height / 4);
        positionY2 -= (height / 4);

        var TO_RADIANS = Math.PI / 180,
            angleInRad = (m / 2.5) * TO_RADIANS;
        console.log("TO_RADIANS", TO_RADIANS);

        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
        canvasElement.translate(positionX1, positionY1 - 50);
        canvasElement.rotate(angleInRad);
        canvasElement.drawImage(this.state.imageFilter, 0, 0, width, height);
        /*canvasElement.translate(positionX1 ,positionY1) 
        canvasElement.translate(1,0,0,0,positionX1+(width/2),positionY1); 
        canvasElement.rotate(angleInRad);    */
        //canvasElement.drawImage(this.state.imageFilter,0,0,width,height);
        //canvasElement.restore();
        canvasElement.setTransform(1, 0, 0, 1, 0, 0);
        //this.rotateAndPaintImage(canvasElement, this.state.imageFilter, angleInRad, positionX1, positionY1,20,0 );
    }

    rotateAndPaintImage(context, image, angleInRad, positionX, positionY, axisX, axisY) {
        context.translate(positionX, positionY);
        context.rotate(angleInRad);
        context.drawImage(image, -axisX, -axisY);
        context.rotate(-angleInRad);
        context.translate(-positionX, -positionY);
    }

    isModelLoaded() {
        if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1) return faceapi.nets.ssdMobilenetv1.params;
        if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) return faceapi.nets.tinyFaceDetector.params;
    }


    async componentDidMount() {
        console.log("height: " + window.screen.height + ", width: " + window.screen.width);

        // obtener parametros de configuracion y asignar el modelo que vamos a usar para reconocer rostros
        this.setDetectorOptions();
        this.props.SET_VIDEO_HANDLER_IN_GAME_FACENET(this.setVideoHandler);

        // asignar los archivos del model a face-api
        let modelFolder = "/models";

        
        let dirs = { filtro1: '/filter/s1.svg', filtro2: '/filter/s2.svg', filtro3: '/filter/s3.svg', 
        filtro4: '/filter/s4.svg', filtro5: '/filter/s5.svg', filtro6: '/filter/s6.svg', 
        filtro7: '/filter/s7.svg', filtro8: '/filter/s8.svg', filtro9: '/filter/s9.svg',
        filtro10: '/filter/s10.svg', filtro11: '/filter/s11.svg', filtro12: '/filter/s12.svg',
        filtro13: '/filter/s13.svg', filtro14: '/filter/s14.svg', filtro15: '/filter/s15.svg'
    }
        let valor = 'filtro1'
        try {
            await faceapi.loadFaceLandmarkModel(modelFolder);
            await faceapi.nets.ageGenderNet.loadFromUri(modelFolder);
            await faceapi.nets.faceExpressionNet.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1) await faceapi.nets.ssdMobilenetv1.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) await faceapi.nets.tinyFaceDetector.load(modelFolder);

            this.state.imageFilter.src = (dirs[valor]);
            this.state.imageFilter.onload = function () {
                console.log("image is loaded");

            }
        } catch (exception) {
            console.log("exception", exception);
        }
    }


    async componentDidUpdate() {

        this.props.SET_VIDEO_HANDLER_IN_GAME_FACENET(this.setVideoHandler);

        // asignar los archivos del model a face-api
        let modelFolder = "/models";

        let dirs = { filtro1: '/filter/s1.svg', filtro2: '/filter/s2.svg', filtro3: '/filter/s3.svg', 
        filtro4: '/filter/s4.svg', filtro5: '/filter/s5.svg', filtro6: '/filter/s6.svg', 
        filtro7: '/filter/s7.svg', filtro8: '/filter/s8.svg', filtro9: '/filter/s9.svg',
        filtro10: '/filter/s10.svg', filtro11: '/filter/s11.svg', filtro12: '/filter/s12.svg',
        filtro13: '/filter/s13.svg', filtro14: '/filter/s14.svg', filtro15: '/filter/s15.svg'
    }


        let valor = this.state.filterName
        try {
            await faceapi.loadFaceLandmarkModel(modelFolder);
            await faceapi.nets.ageGenderNet.loadFromUri(modelFolder);
            await faceapi.nets.faceExpressionNet.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.SSD_MOBILENETV1) await faceapi.nets.ssdMobilenetv1.loadFromUri(modelFolder);
            if (this.props.selected_face_detector === this.props.TINY_FACE_DETECTOR) await faceapi.nets.tinyFaceDetector.load(modelFolder);

            this.state.imageFilter.src = (dirs[valor]);
            this.state.imageFilter.onload = function () {
                console.log("image is loaded");

            }
        } catch (exception) {
            console.log("exception", exception);
        }

    }
    setDetectorOptions() {
        let minConfidence = this.props.min_confidence,
            inputSize = this.props.input_size,
            scoreThreshold = this.props.score_threshold;

        // identificar el modelo previsamente entrenado para reconocer rostos.
        // el modelo por defecto es tiny_face_detector
        let options = this.props.selected_face_detector === this.props.SSD_MOBILENETV1
            ? new faceapi.SsdMobilenetv1Options({ minConfidence })
            : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
        this.props.SET_DETECTOR_OPTIONS_IN_GAME_FACENET(options);
    }

    render() {
        return (
            <div>
                <Camera />
                <Canva />

                <input type="number"
                    style={{ marginLeft: 1000 }}
                    value={this.state.positionIndex}
                    onChange={(event) => { this.setState({ positionIndex: event.target.value }) }} />

                <button type="button" value='filtro1' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro1</button>
                <button type="button" value='filtro2' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro2</button>
                <button type="button" value='filtro3' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro3</button>
                <button type="button" value='filtro4' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro4</button>
                <button type="button" value='filtro5' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro5</button>
                <button type="button" value='filtro6' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro6</button>
                <button type="button" value='filtro7' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro7</button>
                <button type="button" value='filtro8' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro8</button>
                <button type="button" value='filtro9' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro9</button>
                <button type="button" value='filtro10' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro10</button>
                <button type="button" value='filtro11' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro11</button>
                <button type="button" value='filtro12' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro12</button>
                <button type="button" value='filtro13' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro13</button>
                <button type="button" value='filtro14' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro14</button>
                <button type="button" value='filtro15' onClick={(event) => { this.setState({ filterName: event.target.value }) }}>filtro15</button>

                
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FacePage);