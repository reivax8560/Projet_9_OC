/**
 * @jest-environment jsdom
 */

import { log } from "console"
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js"
import { bills } from "../fixtures/bills.js"
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)
///////////////////////////////////////////////////////////////// DASHBOARD EMPLOYÉ ///////////////////////////////////////////////////////////////////
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    ///////////////////////////////////////////////////////////////////////////////// ICONE EN SURBRILLANCE (code initial)
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      const iconClass = windowIcon.className
      // to-do write expect expression
      expect(iconClass).toEqual("active-icon")                    // ajout de la mention expect
    })

    //////////////////////////////////////////////////////////////////////////// BILLS DU + RECENT AU + ANCIEN (code initial)
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    ///////////////////////////////////////////////////////////////////////////////// STATUTS BILLS AFFICHÉS
    test("Then, bills status should be displayed", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      expect(screen.getAllByText('accepted')).toBeTruthy()
      expect(screen.getAllByText('refused')).toBeTruthy()
      expect(screen.getAllByText('pending')).toBeTruthy()
    })

    //////////////////////////////////////////////////////////////////////// JUSTIF AFFICHÉ QUAND CLIC SUR OEIL
    test("Then, proof should be displayed when icon eye is clicked", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const billsContainer = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })

      const iconEye = document.querySelector("div[data-bill-url='https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a']")
      $.fn.modal = jest.fn();
      const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))
      iconEye.addEventListener('click', handleClickIconEye)
      userEvent.click(iconEye)

      expect(handleClickIconEye).toHaveBeenCalled()
      await waitFor(() => screen.getByAltText(`Bill`))
      expect(screen.getByAltText(`Bill`)).toBeTruthy()

    })

    /////////////////////////////////////////////////////////////// FORMULAIRE AFFICHÉ QUAND CLIC SUR "NOUVELLE NOTE"
    test("Then, new bill form should be displayed when new bill button is clicked", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const billsContainer = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })

      const newBillBtn = screen.getByTestId('btn-new-bill')
      const handleClickNewBill = jest.fn(() => billsContainer.handleClickNewBill())
      newBillBtn.addEventListener('click', handleClickNewBill)
      userEvent.click(newBillBtn)

      expect(handleClickNewBill).toHaveBeenCalled()
      await waitFor(() => screen.getByTestId('form-new-bill'))
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    /////////////////////////////////////////////////////////////// BILLS RÉCUPÉRÉES DEPUIS LE MOCK
    test("fetches bills from mock API GET", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
      const BillName = await screen.getByText("test2")
      expect(BillName).toBeTruthy()
    })
    /////////////////////////////////////////////////////////////////////// TEST LOADING (idem dashboard)
    describe('When I am on Bills page but it is loading', () => {
      test('Then, Loading page should be rendered', () => {
        document.body.innerHTML = BillsUI({ loading: true })
        expect(screen.getAllByText('Loading...')).toBeTruthy()
      })
    })
    ///////////////////////////////////////////////////////////////////// TEST ERROR (idem dashboard)
    describe('When I am on Bills page but back-end send an error message', () => {
      test('Then, Error page should be rendered', () => {
        document.body.innerHTML = BillsUI({ error: 'some error message' })
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      })
    })
    //////////////////////////////////////////////////////////////////////////// ERREURS AVEC L'API (idem dashboard)
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      //////////////////////////////////////////////////////////////////////////// TEST ERREUR 404 (idem dashboard)
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      //////////////////////////////////////////////////////////////////////////// TEST ERREUR 500 (idem dashboard)
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
